import "server-only";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import type { Lead } from "../model/lead";

/**
 * Lead persistence — the commit point of the funnel. `insert` must succeed
 * before a visitor is told their price is coming, and nothing after it (a
 * notification, an analytics event) may turn a durable lead into a lost one.
 *
 * The table is the Rust server's, unchanged, plus `location_id`: the file on
 * the prod volume is opened as it is and brought forward in place.
 */
export interface LeadStore {
  insert(lead: Lead): number;
  count(): number;
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

function migrate(db: DatabaseSync): void {
  db.exec(`CREATE TABLE IF NOT EXISTS leads (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    job     TEXT NOT NULL,
    zip     TEXT NOT NULL,
    mobile  TEXT NOT NULL,
    at      TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  const columns = db.prepare("PRAGMA table_info(leads)").all().map(row => column(row, "name"));
  // Nullable: every row written before points existed has no point, and
  // inventing one for them would be a lie in the one table that matters.
  if (!columns.includes("location_id")) {
    db.exec("ALTER TABLE leads ADD COLUMN location_id TEXT");
  }
}

export function openLeadStore(path: string): LeadStore {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new (sqlite().DatabaseSync)(path);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA busy_timeout = 5000");
  migrate(db);
  const insert = db.prepare("INSERT INTO leads (job, zip, mobile, location_id) VALUES (?, ?, ?, ?) RETURNING id");
  const count = db.prepare("SELECT COUNT(*) AS n FROM leads");
  return {
    insert(lead) {
      return integer(insert.get(lead.job, lead.zip, lead.mobile, lead.locationId), "id");
    },
    count() {
      return integer(count.get(), "n");
    },
    close() {
      db.close();
    },
  };
}
