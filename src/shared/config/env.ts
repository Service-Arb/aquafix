import "server-only";
import { homedir } from "node:os";
import { join } from "node:path";
import { parseLeadDb, type LeadDb } from "@/shared/landing/server/lead-store";
import { site } from "./site";

/**
 * The server's runtime configuration, parsed once. Secrets (`SMTP_URL`,
 * `SMS_TOKEN`, `POSTHOG_KEY`) arrive from the container environment and never
 * from the image.
 *
 * Production has no defaults for where state lives. The Rust server booted on
 * dev defaults when nobody passed its config — leads written outside the
 * mounted volume — and that is the failure this refuses: in production a
 * missing lead store (`LEADS_DB_URL` or `LEADS_DB_PATH`) fails `instrumentation.ts`, and Next then answers 500
 * to every request, `/health` included — a pod that never turns ready, rather
 * than one that loses the first lead.
 */
export interface ServerEnv {
  production: boolean;
  /** Where leads are kept; see `LeadDb`. */
  leadsDb: LeadDb;
  /** Where the live location data comes from; absent → the baked config. */
  locationsApiUrl: string | null;
  smtpUrl: string | null;
  notifyTo: string | null;
  notifyFrom: string | null;
  smsToken: string | null;
  posthogKey: string | null;
  posthogHost: string;
}

type Source = Readonly<Record<string, string | undefined>>;

function opt(source: Source, name: string): string | null {
  const value = source[name]?.trim();
  return value ? value : null;
}

function url(source: Source, name: string): string | null {
  const value = opt(source, name);
  if (value === null) return null;
  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`${name} is not a URL: ${JSON.stringify(value)}`);
  }
}

/**
 * `LEADS_DB_URL` picks the adapter by scheme; `LEADS_DB_PATH`, the setting the
 * deployed image already carries, is the SQLite file and stays valid.
 */
function leadsDb(source: Source, production: boolean): LeadDb {
  const dbUrl = opt(source, "LEADS_DB_URL");
  if (dbUrl !== null) return parseLeadDb(dbUrl);
  const path = opt(source, "LEADS_DB_PATH");
  if (path !== null) return { kind: "sqlite", path };
  if (production) {
    throw new Error(
      "LEADS_DB_URL or LEADS_DB_PATH is required in production — the leads volume, e.g. /data/leads.db",
    );
  }
  return { kind: "sqlite", path: join(homedir(), ".local/share", site.brand.id, "leads.db") };
}

export function parseServerEnv(source: Source): ServerEnv {
  const production = source.NODE_ENV === "production";
  return {
    production,
    leadsDb: leadsDb(source, production),
    locationsApiUrl: url(source, "LOCATIONS_API_URL"),
    smtpUrl: opt(source, "SMTP_URL"),
    notifyTo: opt(source, "LEAD_NOTIFY_TO"),
    notifyFrom: opt(source, "LEAD_NOTIFY_FROM"),
    smsToken: opt(source, "SMS_TOKEN"),
    posthogKey: opt(source, "POSTHOG_KEY"),
    // Explicit because PostHog rejects a project's events at the other
    // region's host; the audience is French, so EU unless told otherwise.
    posthogHost: url(source, "POSTHOG_HOST") ?? "https://eu.i.posthog.com",
  };
}

let cached: ServerEnv | undefined;

/** Lazy: `next build` imports this module and must not need prod secrets. */
export function serverEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}
