import "server-only";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * The server's runtime configuration, parsed once. Secrets (`SMTP_URL`,
 * `SMS_TOKEN`, `POSTHOG_KEY`) arrive from the container environment and never
 * from the image.
 *
 * Production has no defaults for where state lives. The Rust server booted on
 * dev defaults when nobody passed its config — leads written outside the
 * mounted volume — and that is the failure this refuses: in production a
 * missing `LEADS_DB_PATH` stops the server at start (`instrumentation.ts`),
 * not at the first lead.
 */
export interface ServerEnv {
  production: boolean;
  leadsDbPath: string;
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

export function parseServerEnv(source: Source): ServerEnv {
  const production = source.NODE_ENV === "production";
  const leadsDbPath = opt(source, "LEADS_DB_PATH");
  if (production && leadsDbPath === null) {
    throw new Error("LEADS_DB_PATH is required in production — the leads volume, e.g. /data/leads.db");
  }
  return {
    production,
    leadsDbPath: leadsDbPath ?? join(homedir(), ".local/share/aquafix/leads.db"),
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
