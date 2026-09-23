import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { Lead } from "@/entities/lead";
import { openLeadStore } from "@/entities/lead/server";
import { acceptLead, RateLimiter, type AcceptDeps } from "@/features/quote-form";

const NOW = 1_800_000_000_000;
const tmp = () => join(mkdtempSync(join(tmpdir(), "aquafix-leads-")), "leads.db");
const sqlite = () => process.getBuiltinModule("node:sqlite");

function form(fields: Record<string, string>, omit: string[] = []): FormData {
  const data = new FormData();
  const base = { location: "royat", locale: "fr", form_id: "quote", t: String(NOW - 10_000), website: "" };
  for (const [k, v] of Object.entries({ ...base, ...fields })) if (!omit.includes(k)) data.set(k, v);
  return data;
}

const good = { job: "blocked_drain", zip: "63130", mobile: "06 12 34 56 78" };
const lead = (over: Partial<Lead> = {}): Lead => ({ ...good, locationId: "royat", spamVerdict: null, ...over });

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
    expect(store.insert(lead())).toBe(1);
    expect(store.insert(lead({ locationId: null, spamVerdict: "too-fast" }))).toBe(2);
    expect(store.count()).toBe(2);
    store.close();
  });

  it("brings the Rust server's table forward in place, keeping its rows", () => {
    const path = tmp();
    const legacy = new (sqlite().DatabaseSync)(path);
    legacy.exec(`CREATE TABLE leads (id INTEGER PRIMARY KEY AUTOINCREMENT, job TEXT NOT NULL, zip TEXT NOT NULL,
      mobile TEXT NOT NULL, at TEXT NOT NULL DEFAULT (datetime('now')))`);
    legacy.exec("INSERT INTO leads (job, zip, mobile) VALUES ('hot_water', '97210', '5035550148')");
    legacy.close();

    const store = openLeadStore(path);
    expect(store.insert(lead({ locationId: "lyon-nord", spamVerdict: "honeypot" }))).toBe(2);
    store.close();
    const check = new (sqlite().DatabaseSync)(path);
    expect(check.prepare("SELECT location_id, spam_verdict FROM leads ORDER BY id").all()).toEqual([
      { location_id: null, spam_verdict: null },
      { location_id: "lyon-nord", spam_verdict: "honeypot" },
    ]);
    check.close();
  });
});

describe("accepting a lead", () => {
  it("stores the lead before anything else, and a failed notification does not lose it", async () => {
    const store = openLeadStore(tmp());
    const { d, flush, log } = deps({
      insert: l => store.insert(l),
      notify: async () => {
        throw new Error("SMTP down");
      },
    });
    const outcome = acceptLead(form(good), "1.2.3.4", d);
    expect(outcome).toMatchObject({ kind: "stored", id: 1, lead: { locationId: "royat", spamVerdict: null } });
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

  it("rejects a lead with no reachable number without storing it, and without spending the limit", () => {
    const insert = vi.fn(() => 1);
    const limiter = new RateLimiter(1, 60_000);
    const { d } = deps({ insert, limiter });
    expect(acceptLead(form({ ...good, mobile: "0612" }), "1.2.3.4", d)).toMatchObject({ kind: "invalid" });
    expect(acceptLead(form({ ...good, zip: " " }), "1.2.3.4", d)).toMatchObject({ kind: "invalid" });
    expect(insert).not.toHaveBeenCalled();
    // The corrected form is the address's first counted submission.
    expect(acceptLead(form(good), "1.2.3.4", d)).toMatchObject({ kind: "stored", lead: { spamVerdict: null } });
  });

  it("keeps a honeypot submission, flagged and not notified", async () => {
    const store = openLeadStore(tmp());
    const notify = vi.fn(async () => undefined);
    const capture = vi.fn();
    const { d, flush } = deps({ insert: l => store.insert(l), notify, capture });
    expect(acceptLead(form({ ...good, website: "http://spam" }), "1.2.3.4", d)).toMatchObject({
      kind: "stored",
      lead: { spamVerdict: "honeypot" },
    });
    await flush();
    expect(store.count()).toBe(1);
    expect(notify).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
    store.close();
  });

  // The stamp is the client's word, so it marks and never withholds.
  it.each([
    ["a fast submit", { t: String(NOW - 500) }, []],
    ["an empty stamp", { t: "" }, []],
    ["the Rust form, which had no stamp", {}, ["t"]],
  ] as const)("flags %s as too-fast and still notifies", async (_, fields, omit) => {
    const notify = vi.fn(async () => undefined);
    const { d, flush } = deps({ notify });
    expect(acceptLead(form({ ...good, ...fields }, [...omit]), "1.2.3.4", d)).toMatchObject({
      kind: "stored",
      lead: { spamVerdict: "too-fast" },
    });
    await flush();
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ spamVerdict: "too-fast" }), 1);
  });

  it("keeps a rate-limited submission flagged, per client key", () => {
    const { d } = deps({ limiter: new RateLimiter(1, 60_000) });
    expect(acceptLead(form(good), "1.2.3.4", d)).toMatchObject({ lead: { spamVerdict: null } });
    expect(acceptLead(form(good), "1.2.3.4", d)).toMatchObject({ kind: "stored", lead: { spamVerdict: "rate-limited" } });
    expect(acceptLead(form(good), "5.6.7.8", d)).toMatchObject({ lead: { spamVerdict: null } });
  });

  it.each([
    ["an unknown point", { location: "paris" }, []],
    ["no point at all", {}, ["location"]],
  ] as const)("stores a lead from %s with no location", (_, fields, omit) => {
    const insert = vi.fn(() => 7);
    const { d } = deps({ insert });
    expect(acceptLead(form({ ...good, ...fields }, [...omit]), "1.2.3.4", d)).toMatchObject({
      kind: "stored",
      id: 7,
      lead: { locationId: null },
    });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ locationId: null }));
  });

  it("records the submission for analytics only after it is stored", async () => {
    const capture = vi.fn();
    const { d, flush } = deps({ capture });
    acceptLead(form(good), "1.2.3.4", d);
    expect(capture).not.toHaveBeenCalled();
    await flush();
    expect(capture).toHaveBeenCalledWith(expect.objectContaining({ locationId: "royat" }), "quote");
  });
});
