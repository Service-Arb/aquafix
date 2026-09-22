import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { Lead } from "@/entities/lead";
import { openLeadStore } from "@/entities/lead/server";
import { acceptLead, RateLimiter, type AcceptDeps } from "@/features/quote-form";

const NOW = 1_800_000_000_000;
const tmp = () => join(mkdtempSync(join(tmpdir(), "aquafix-leads-")), "leads.db");

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  const base = { location: "royat", locale: "fr", form_id: "quote", t: String(NOW - 10_000), website: "" };
  for (const [k, v] of Object.entries({ ...base, ...fields })) data.set(k, v);
  return data;
}

const good = { job: "blocked_drain", zip: "63130", mobile: "06 12 34 56 78" };

function deps(over: Partial<AcceptDeps> = {}) {
  const deferred: (() => Promise<void> | void)[] = [];
  const log = { warn: vi.fn(), error: vi.fn() };
  const d: AcceptDeps = {
    insert: () => 1,
    defer: task => void deferred.push(task),
    notify: async () => undefined,
    capture: () => undefined,
    limiter: new RateLimiter(5, 60_000),
    now: NOW,
    log,
    ...over,
  };
  return { d, deferred, log, flush: () => Promise.all(deferred.map(t => t())) };
}

describe("the lead store", () => {
  it("inserts a lead with its point and counts it", () => {
    const store = openLeadStore(tmp());
    const lead: Lead = { ...good, locationId: "royat" };
    expect(store.insert(lead)).toBe(1);
    expect(store.insert(lead)).toBe(2);
    expect(store.count()).toBe(2);
    store.close();
  });

  it("brings the Rust server's table forward in place, keeping its rows", () => {
    const path = tmp();
    const sqlite = process.getBuiltinModule("node:sqlite");
    const legacy = new sqlite.DatabaseSync(path);
    legacy.exec(`CREATE TABLE leads (id INTEGER PRIMARY KEY AUTOINCREMENT, job TEXT NOT NULL, zip TEXT NOT NULL,
      mobile TEXT NOT NULL, at TEXT NOT NULL DEFAULT (datetime('now')))`);
    legacy.exec("INSERT INTO leads (job, zip, mobile) VALUES ('hot_water', '97210', '5035550148')");
    legacy.close();

    const store = openLeadStore(path);
    expect(store.insert({ ...good, locationId: "lyon-nord" })).toBe(2);
    expect(store.count()).toBe(2);
    store.close();
    const check = new sqlite.DatabaseSync(path);
    expect(check.prepare("SELECT location_id FROM leads ORDER BY id").all()).toEqual([
      { location_id: null },
      { location_id: "lyon-nord" },
    ]);
    check.close();
  });
});

describe("accepting a lead", () => {
  it("stores the lead before anything else, and a failed notification does not lose it", async () => {
    const store = openLeadStore(tmp());
    const { d, flush, log } = deps({
      insert: lead => store.insert(lead),
      notify: async () => {
        throw new Error("SMTP down");
      },
    });
    const outcome = acceptLead(form(good), "1.2.3.4", d);
    expect(outcome).toMatchObject({ kind: "stored", id: 1, lead: { locationId: "royat" } });
    // Durable already — the notification has not even run yet.
    expect(store.count()).toBe(1);
    await flush();
    expect(store.count()).toBe(1);
    expect(log.error).toHaveBeenCalledWith(expect.stringContaining("notification failed"), expect.any(Error));
    store.close();
  });

  it("never reports a stored lead the store refused", () => {
    const { d, deferred } = deps({
      insert: () => {
        throw new Error("disk full");
      },
    });
    expect(acceptLead(form(good), "1.2.3.4", d)).toMatchObject({ kind: "failed" });
    expect(deferred).toHaveLength(0);
  });

  it("rejects a lead with no reachable number without storing it", () => {
    const insert = vi.fn(() => 1);
    const { d } = deps({ insert });
    expect(acceptLead(form({ ...good, mobile: "0612" }), "1.2.3.4", d)).toMatchObject({ kind: "invalid" });
    expect(acceptLead(form({ ...good, zip: " " }), "1.2.3.4", d)).toMatchObject({ kind: "invalid" });
    expect(insert).not.toHaveBeenCalled();
  });

  it("drops spam silently and never stores it", () => {
    const insert = vi.fn(() => 1);
    const { d } = deps({ insert });
    expect(acceptLead(form({ ...good, website: "x" }), "1.2.3.4", d)).toMatchObject({ kind: "spam", verdict: "honeypot" });
    expect(acceptLead(form({ ...good, t: String(NOW - 500) }), "1.2.3.4", d)).toMatchObject({
      kind: "spam",
      verdict: "too-fast",
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it("refuses a point that does not exist", () => {
    const { d } = deps();
    expect(acceptLead(form({ ...good, location: "paris" }), "1.2.3.4", d)).toEqual({ kind: "unknown-location" });
  });

  it("records the submission for analytics only after it is stored", () => {
    const capture = vi.fn();
    const { d, flush } = deps({ capture });
    acceptLead(form(good), "1.2.3.4", d);
    return flush().then(() => expect(capture).toHaveBeenCalledWith(expect.objectContaining({ locationId: "royat" }), "quote"));
  });
});
