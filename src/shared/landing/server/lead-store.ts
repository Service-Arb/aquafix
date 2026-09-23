import "server-only";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import type { Lead } from "../core/lead";

/**
 * Lead persistence — the commit point of the funnel. `insert` must succeed
 * before a visitor is told their price is coming, and nothing after it (a
 * notification, an analytics event) may turn a durable lead into a lost one.
 *
 * The table began as the Rust server's (`job`, `zip`, `mobile`, `at`); the
 * file on a prod volume is opened as it is and brought forward in place. The
 * columns keep their first names — renaming a column on a live volume buys
 * nothing — and map to the lead's `subject`, `locality` and `mobile`.
 */
export interface LeadStore {
  insert(lead: Lead): number;
  count(): number;
  /** The schema version the file is at after opening. */
  version(): number;
  close(): void;
}

// `node:sqlite` is reached through `getBuiltinModule` rather than an import so
// the bundler never has to resolve a builtin it may not know yet; the type is
// the module's own.
function sqlite(): typeof import("node:sqlite") {
  const mod = process.getBuiltinModule("node:sqlite");
  if (!mod) throw new Error("node:sqlite is unavailable — Node ≥ 22.13 is required");
  return mod;
}

/** A column of a row SQLite handed back, checked rather than cast. */
function column(row: unknown, key: string): unknown {
  return typeof row === "object" && row !== null ? Reflect.get(row, key) : undefined;
}

function integer(row: unknown, key: string): number {
  const value = column(row, key);
  if (typeof value === "number" || typeof value === "bigint") return Number(value);
  throw new Error(`leads: expected an integer \`${key}\`, got ${typeof value}`);
}

/**
 * Each step takes the file from version `i` to `i + 1`. Append only: a step
 * that shipped is history, and a file anywhere may be at any of them.
 */
const STEPS: readonly ((db: DatabaseSync) => void)[] = [
  // 1 — the Rust server's table.
  db =>
    db.exec(`CREATE TABLE leads (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      job     TEXT NOT NULL,
      zip     TEXT NOT NULL,
      mobile  TEXT NOT NULL,
      at      TEXT NOT NULL DEFAULT (datetime('now'))
    )`),
  // 2 — the point a lead came from. Nullable: every row written before points
  // existed has none, and inventing one would be a lie in the one table that matters.
  db => db.exec("ALTER TABLE leads ADD COLUMN location_id TEXT"),
  // 3 — suspected spam is kept, flagged, and never notified: a false positive
  // is a customer, and a reviewer can still find it here.
  db => db.exec("ALTER TABLE leads ADD COLUMN spam_verdict TEXT"),
  // 4 — the brand's extra fields, as a JSON object; `NULL` when there are none.
  db => db.exec("ALTER TABLE leads ADD COLUMN extras TEXT"),
];

export const LEAD_SCHEMA_VERSION = STEPS.length;

const RUST_COLUMNS = ["id", "job", "zip", "mobile", "at"];

function userVersion(db: DatabaseSync): number {
  return integer(db.prepare("PRAGMA user_version").get(), "user_version");
}

/**
 * Step 0, for a file no versioned store has opened (`user_version` 0): which
 * step it already stands at, read off the columns. The Rust server and the
 * first Node port both left an unversioned table; the port added its columns
 * one at a time, so a file may stop at any of them.
 */
function recognise(db: DatabaseSync): number {
  const columns = db.prepare("PRAGMA table_info(leads)").all().map(row => column(row, "name"));
  if (columns.length === 0) return 0;
  if (!RUST_COLUMNS.every(c => columns.includes(c))) {
    throw new Error(`leads: an unrecognised table (${columns.join(", ")}); refusing to migrate it`);
  }
  let at = 1;
  for (const [step, added] of [[2, "location_id"], [3, "spam_verdict"], [4, "extras"]] as const) {
    if (!columns.includes(added)) break;
    at = step;
  }
  return at;
}

/** Runs `fn` under a write lock; two pods opening one file take turns. */
function immediate(db: DatabaseSync, fn: () => void): void {
  db.exec("BEGIN IMMEDIATE");
  try {
    fn();
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function migrate(db: DatabaseSync): void {
  immediate(db, () => {
    if (userVersion(db) === 0) db.exec(`PRAGMA user_version = ${recognise(db)}`);
  });
  for (let target = 1; target <= STEPS.length; target++) {
    immediate(db, () => {
      // Read again under the lock: another process may have run this step.
      if (userVersion(db) >= target) return;
      STEPS[target - 1]?.(db);
      db.exec(`PRAGMA user_version = ${target}`);
    });
  }
}

export function openLeadStore(path: string): LeadStore {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new (sqlite().DatabaseSync)(path);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA busy_timeout = 5000");
  migrate(db);
  const insert = db.prepare(
    "INSERT INTO leads (job, zip, mobile, location_id, spam_verdict, extras) VALUES (?, ?, ?, ?, ?, ?) RETURNING id",
  );
  const count = db.prepare("SELECT COUNT(*) AS n FROM leads");
  return {
    insert(lead) {
      const extras = Object.keys(lead.extras).length > 0 ? JSON.stringify(lead.extras) : null;
      return integer(
        insert.get(lead.subject, lead.locality, lead.mobile, lead.placeSlug, lead.spamVerdict, extras),
        "id",
      );
    },
    count() {
      return integer(count.get(), "n");
    },
    version() {
      return userVersion(db);
    },
    close() {
      db.close();
    },
  };
}
