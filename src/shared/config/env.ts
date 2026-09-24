import "server-only";
import { createServerEnv, type ServerEnv } from "@evinvest/kitstart/server";
import { site } from "./site";

export type { ServerEnv };

/**
 * The server's runtime configuration, parsed once and lazily — `next build`
 * imports this module and must not need prod secrets. Secrets (`SMTP_URL`,
 * `SMS_TOKEN`, `POSTHOG_KEY`) arrive from the container environment and never
 * from the image.
 *
 * Production has no defaults for where state lives nor for whose address the
 * rate limit counts: a missing lead store (`LEADS_DB_URL` or `LEADS_DB_PATH`)
 * or `TRUSTED_PROXY` fails `instrumentation.ts`, and Next then answers 500 to
 * every request, `/health` included — a pod that never turns ready, rather
 * than one that loses the first lead.
 */
export const serverEnv = createServerEnv(site);
