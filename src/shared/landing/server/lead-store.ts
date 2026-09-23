import "server-only";
import type { LeadStore } from "../core/lead";
import { openSqliteLeadStore } from "./lead-store-sqlite";

/**
 * Where leads are kept, chosen by the scheme of `LEADS_DB_URL`:
 *
 * - `sqlite:///data/leads.db` — a file on the pod's volume (the only adapter today);
 * - `postgres://…` / `postgresql://…` — recognised and refused until its
 *   adapter exists, so a deployment that asks for it fails at boot instead of
 *   writing leads somewhere nobody looks.
 */
export type LeadDb = { kind: "sqlite"; path: string };

const POSTGRES = new Set(["postgres:", "postgresql:"]);

export function parseLeadDb(value: string): LeadDb {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`LEADS_DB_URL is not a URL: ${JSON.stringify(value)}`);
  }
  if (url.protocol === "sqlite:") {
    const path = decodeURIComponent(url.pathname);
    if (!path.startsWith("/")) throw new Error(`LEADS_DB_URL: a sqlite path must be absolute, got ${JSON.stringify(value)}`);
    return { kind: "sqlite", path };
  }
  if (POSTGRES.has(url.protocol)) {
    throw new Error("LEADS_DB_URL: the postgres adapter is not implemented yet; use sqlite:///<path>");
  }
  throw new Error(`LEADS_DB_URL: unsupported scheme ${url.protocol}`);
}

export function openLeadStore(db: LeadDb): LeadStore {
  switch (db.kind) {
    case "sqlite":
      return openSqliteLeadStore(db.path);
  }
}
