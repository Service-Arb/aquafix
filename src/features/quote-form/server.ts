import "server-only";
import { leadWebhook, type LeadWebhook, type LeadWebhookOptions } from "@evinvest/kitstart/server";
import { serverEnv } from "@/shared/config/env";
import { site } from "@/shared/config/site";
import { leadCreatedBody, SA_INGEST_SIGNING } from "@/shared/lib/funnel-event";
import { jobLabelFr } from "./lib/job-label";

export { notifier, NOTIFIER_OPTIONS } from "./api/notify";
export { jobLabelFr };

/**
 * kitstart's `panelSuspect`: off until the panel's `lead.created` has a
 * `suspect` property. The panel refuses an unknown one and the outbox would
 * park the lead; off, a rate-limited lead stays in the leads file and no body
 * carries the property.
 */
export const PANEL_SUSPECT = false;

/** The job as the mail names it; a job the form no longer offers stays as posted. */
export const needLabel = (subject: string): string => jobLabelFr(subject) ?? subject;

/** How the site builds and signs its lead webhook; `panelSuspect` is a parameter for the test that flips it. */
export function webhookOptions(keyId: string, panelSuspect: boolean = PANEL_SUSPECT): LeadWebhookOptions {
  return {
    signing: SA_INGEST_SIGNING,
    panelSuspect,
    buildBody: (lead, ctx) => leadCreatedBody(lead, ctx, { sourceId: keyId, needLabel }),
  };
}

let hook: LeadWebhook | null | undefined;

/**
 * Each lead as `lead.created` to the Service-Arb panel, through the outbox in
 * the leads file; `null` without `LEAD_WEBHOOK_URL`. With it,
 * `LEAD_WEBHOOK_KEY_ID` and `LEAD_WEBHOOK_SECRET` are required — checked at
 * boot (`instrumentation.ts`). Here rather than beside `serverEnv`: the body
 * names the job in the copy's words, which `shared` cannot read.
 */
export function webhook(): LeadWebhook | null {
  if (hook !== undefined) return hook;
  const env = serverEnv();
  const target = env.leadWebhook;
  hook = target === null ? null : leadWebhook(site, env, webhookOptions(target.keyId));
  return hook;
}
