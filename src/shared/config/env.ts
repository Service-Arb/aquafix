import "server-only";
import { createServerEnv, leadWebhook, type LeadWebhook, type ServerEnv } from "@evinvest/kitstart/server";
import { leadCreatedBody, SA_INGEST_SIGNING } from "@/shared/lib/funnel-event";
import { site } from "./site";

export type { ServerEnv };

/**
 * The server's runtime configuration, parsed once and lazily — `next build`
 * imports this module and must not need prod secrets. Secrets (`SMTP_URL`,
 * `SMS_TOKEN`, `LEAD_WEBHOOK_SECRET`) arrive from the container environment and never
 * from the image.
 *
 * Production has no defaults for where state lives nor for whose address the
 * rate limit counts: a missing lead store (`LEADS_DB_URL` or `LEADS_DB_PATH`)
 * or `TRUSTED_PROXY` fails `instrumentation.ts`, and Next then answers 500 to
 * every request, `/health` included — a pod that never turns ready, rather
 * than one that loses the first lead.
 */
export const serverEnv = createServerEnv(site);

let hook: LeadWebhook | null | undefined;

/**
 * Each lead as `lead.created` to the Service-Arb panel, through the outbox in
 * the leads file; `null` without `LEAD_WEBHOOK_URL`. With it,
 * `LEAD_WEBHOOK_KEY_ID` and `LEAD_WEBHOOK_SECRET` are required — checked at
 * boot (`instrumentation.ts`).
 */
export function webhook(): LeadWebhook | null {
  if (hook !== undefined) return hook;
  const env = serverEnv();
  const target = env.leadWebhook;
  hook =
    target === null
      ? null
      : leadWebhook(site, env, {
          signing: SA_INGEST_SIGNING,
          buildBody: (lead, ctx) => leadCreatedBody(lead, ctx, target.keyId),
        });
  return hook;
}
