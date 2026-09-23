import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { Lead } from "@/entities/lead";
import { LEAD_SCHEMA_VERSION, openSqliteLeadStore } from "@/entities/lead/server";
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
const lead = (over: Partial<Lead> = {}): Lead => ({
  subject: good.job,
  locality: good.zip,
  mobile: good.mobile,
  extras: {},
  placeSlug: "royat",
  spamVerdict: null,
  ...over,
});

function deps(over: Partial<AcceptDeps> = {}) {
  const deferred: (() => Promise<void> | void)[] = [];
  const log = { warn: vi.fn(), error: vi.fn() };
  const d: AcceptDeps = {
    insert: async () => 1,
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
  it("inserts a lead with its point and counts it", async () => {
    const store = openSqliteLeadStore(tmp());
    expect(await store.insert(lead())).toBe(1);
    expect(await store.insert(lead({ placeSlug: null, spamVerdict: "too-fast" }))).toBe(2);
    expect(await store.count()).toBe(2);
    await store.close();
  });

  it("brings the Rust server's table forward in place, keeping its rows", async () => {
    const path = tmp();
    const legacy = new (sqlite().DatabaseSync)(path);
    legacy.exec(`CREATE TABLE leads (id INTEGER PRIMARY KEY AUTOINCREMENT, job TEXT NOT NULL, zip TEXT NOT NULL,
      mobile TEXT NOT NULL, at TEXT NOT NULL DEFAULT (datetime('now')))`);
    legacy.exec("INSERT INTO leads (job, zip, mobile) VALUES ('hot_water', '97210', '5035550148')");
    legacy.close();

    const store = openSqliteLeadStore(path);
    expect(await store.insert(lead({ placeSlug: "lyon-nord", spamVerdict: "honeypot" }))).toBe(2);
    await store.close();
    const check = new (sqlite().DatabaseSync)(path);
    expect(check.prepare("SELECT location_id, spam_verdict FROM leads ORDER BY id").all()).toEqual([
      { location_id: null, spam_verdict: null },
      { location_id: "lyon-nord", spam_verdict: "honeypot" },
    ]);
    check.close();
  });
});

/**
 * The store as it shipped before its schema was versioned (71045d0): the Rust
 * table created if absent, then each column added if missing, `user_version`
 * never touched. Every prod volume the Node port has written looks like this.
 */
function openWithUnversionedStore(path: string, columns: readonly ("location_id" | "spam_verdict")[]): void {
  const db = new (sqlite().DatabaseSync)(path);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec(`CREATE TABLE IF NOT EXISTS leads (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    job     TEXT NOT NULL,
    zip     TEXT NOT NULL,
    mobile  TEXT NOT NULL,
    at      TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  for (const column of columns) db.exec(`ALTER TABLE leads ADD COLUMN ${column} TEXT`);
  if (columns.includes("location_id") && columns.includes("spam_verdict")) {
    db.prepare("INSERT INTO leads (job, zip, mobile, location_id, spam_verdict) VALUES (?, ?, ?, ?, ?)").run(
      "tap_toilet",
      "69003",
      "0612345678",
      "desgenettes",
      "too-fast",
    );
  } else {
    db.prepare("INSERT INTO leads (job, zip, mobile) VALUES (?, ?, ?)").run("tap_toilet", "69003", "0612345678");
  }
  db.close();
}

const columnsOf = (path: string): unknown[] => {
  const db = new (sqlite().DatabaseSync)(path);
  const names = db
    .prepare("PRAGMA table_info(leads)")
    .all()
    .map(r => (typeof r === "object" && r !== null ? Reflect.get(r, "name") : undefined));
  db.close();
  return names;
};

describe("the lead store's migrations", () => {
  it("creates a fresh file at the latest version", async () => {
    const path = tmp();
    const store = openSqliteLeadStore(path);
    expect(store.version()).toBe(LEAD_SCHEMA_VERSION);
    await store.close();
    expect(columnsOf(path)).toEqual(["id", "job", "zip", "mobile", "at", "location_id", "spam_verdict", "extras"]);
  });

  it("recognises a file the unversioned Node store wrote, and keeps its rows", async () => {
    const path = tmp();
    openWithUnversionedStore(path, ["location_id", "spam_verdict"]);

    const store = openSqliteLeadStore(path);
    expect(store.version()).toBe(LEAD_SCHEMA_VERSION);
    expect(await store.insert(lead({ extras: { surface_m2: "40" } }))).toBe(2);
    expect(await store.count()).toBe(2);
    await store.close();

    const check = new (sqlite().DatabaseSync)(path);
    expect(check.prepare("SELECT job, zip, location_id, spam_verdict, extras FROM leads ORDER BY id").all()).toEqual([
      { job: "tap_toilet", zip: "69003", location_id: "desgenettes", spam_verdict: "too-fast", extras: null },
      { job: "blocked_drain", zip: "63130", location_id: "royat", spam_verdict: null, extras: '{"surface_m2":"40"}' },
    ]);
    check.close();
  });

  it("finishes a file the unversioned store left halfway (location_id only)", async () => {
    const path = tmp();
    openWithUnversionedStore(path, ["location_id"]);
    const store = openSqliteLeadStore(path);
    expect(store.version()).toBe(LEAD_SCHEMA_VERSION);
    await store.close();
    expect(columnsOf(path)).toEqual(["id", "job", "zip", "mobile", "at", "location_id", "spam_verdict", "extras"]);
  });

  it("opens a migrated file again without touching it", async () => {
    const path = tmp();
    await openSqliteLeadStore(path).close();
    const again = openSqliteLeadStore(path);
    expect(again.version()).toBe(LEAD_SCHEMA_VERSION);
    expect(await again.insert(lead())).toBe(1);
    await again.close();
  });

  it("refuses a `leads` table it does not recognise instead of altering it", async () => {
    const path = tmp();
    const db = new (sqlite().DatabaseSync)(path);
    db.exec("CREATE TABLE leads (id INTEGER PRIMARY KEY, name TEXT)");
    db.close();
    expect(() => openSqliteLeadStore(path)).toThrow(/unrecognised table/);
    expect(columnsOf(path)).toEqual(["id", "name"]);
  });
});

describe("accepting a lead", () => {
  it("stores the lead before anything else, and a failed notification does not lose it", async () => {
    const store = openSqliteLeadStore(tmp());
    const { d, flush, log } = deps({
      insert: l => store.insert(l),
      notify: async () => {
        throw new Error("SMTP down");
      },
    });
    const outcome = await acceptLead(form(good), "1.2.3.4", d);
    expect(outcome).toMatchObject({ kind: "stored", id: 1, lead: { placeSlug: "royat", spamVerdict: null } });
    // Durable already — the notification has not even run yet.
    expect(await store.count()).toBe(1);
    await flush();
    expect(await store.count()).toBe(1);
    expect(log.error).toHaveBeenCalledWith(expect.stringContaining("notification failed"), expect.any(Error));
    await store.close();
  });

  it("never reports a stored lead the store refused", async () => {
    const { d, deferred } = deps({
      insert: async () => {
        throw new Error("disk full");
      },
    });
    expect(await acceptLead(form(good), "1.2.3.4", d)).toMatchObject({ kind: "failed" });
    expect(deferred).toHaveLength(0);
  });

  it("rejects a lead with no reachable number without storing it, and without spending the limit", async () => {
    const insert = vi.fn(async () => 1);
    const limiter = new RateLimiter(1, 60_000);
    const { d } = deps({ insert, limiter });
    expect(await acceptLead(form({ ...good, mobile: "0612" }), "1.2.3.4", d)).toMatchObject({ kind: "invalid" });
    expect(await acceptLead(form({ ...good, zip: " " }), "1.2.3.4", d)).toMatchObject({ kind: "invalid" });
    expect(insert).not.toHaveBeenCalled();
    // The corrected form is the address's first counted submission.
    expect(await acceptLead(form(good), "1.2.3.4", d)).toMatchObject({ kind: "stored", lead: { spamVerdict: null } });
  });

  it("keeps a honeypot submission, flagged and not notified", async () => {
    const store = openSqliteLeadStore(tmp());
    const notify = vi.fn(async () => undefined);
    const capture = vi.fn();
    const { d, flush } = deps({ insert: l => store.insert(l), notify, capture });
    expect(await acceptLead(form({ ...good, website: "http://spam" }), "1.2.3.4", d)).toMatchObject({
      kind: "stored",
      lead: { spamVerdict: "honeypot" },
    });
    await flush();
    expect(await store.count()).toBe(1);
    expect(notify).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
    await store.close();
  });

  // The stamp is the client's word, so it marks and never withholds.
  it.each([
    ["a fast submit", { t: String(NOW - 500) }, []],
    ["an empty stamp", { t: "" }, []],
    ["the Rust form, which had no stamp", {}, ["t"]],
  ] as const)("flags %s as too-fast and still notifies", async (_, fields, omit) => {
    const notify = vi.fn(async () => undefined);
    const { d, flush } = deps({ notify });
    expect(await acceptLead(form({ ...good, ...fields }, [...omit]), "1.2.3.4", d)).toMatchObject({
      kind: "stored",
      lead: { spamVerdict: "too-fast" },
    });
    await flush();
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ spamVerdict: "too-fast" }), 1);
  });

  it("keeps a rate-limited submission flagged, per client key", async () => {
    const { d } = deps({ limiter: new RateLimiter(1, 60_000) });
    expect(await acceptLead(form(good), "1.2.3.4", d)).toMatchObject({ lead: { spamVerdict: null } });
    expect(await acceptLead(form(good), "1.2.3.4", d)).toMatchObject({ kind: "stored", lead: { spamVerdict: "rate-limited" } });
    expect(await acceptLead(form(good), "5.6.7.8", d)).toMatchObject({ lead: { spamVerdict: null } });
  });

  it.each([
    ["an unknown point", { location: "paris" }, []],
    ["no point at all", {}, ["location"]],
  ] as const)("stores a lead from %s with no location", async (_, fields, omit) => {
    const insert = vi.fn(async () => 7);
    const { d } = deps({ insert });
    expect(await acceptLead(form({ ...good, ...fields }, [...omit]), "1.2.3.4", d)).toMatchObject({
      kind: "stored",
      id: 7,
      lead: { placeSlug: null },
    });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ placeSlug: null }));
  });

  it("records the submission for analytics only after it is stored", async () => {
    const capture = vi.fn();
    const { d, flush } = deps({ capture });
    await acceptLead(form(good), "1.2.3.4", d);
    expect(capture).not.toHaveBeenCalled();
    await flush();
    expect(capture).toHaveBeenCalledWith(expect.objectContaining({ placeSlug: "royat" }), "quote");
  });
});
