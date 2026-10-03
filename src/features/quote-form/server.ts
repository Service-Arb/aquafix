import "server-only";
import { leadWebhook, type LeadWebhook, type LeadWebhookOptions } from "@evinvest/kitstart/server";
import { serverEnv } from "@/shared/config/env";
import { site } from "@/shared/config/site";
import { leadCreatedBody, SA_INGEST_SIGNING } from "@/shared/lib/funnel-event";
import { jobLabelFr } from "./lib/job-label";

export { notifier, NOTIFIER_OPTIONS } from "./api/notify";
export { jobLabelFr };

/**
 * kitstart's `panelSuspect`, on since the panel's `lead.created` has a
 * `suspect` property (panel v0.3.0): a rate-limited lead is queued too, marked
 * `rate_limited`, and a fast one `too_fast`, for a person to judge in the
 * panel. A honeypot lead still goes nowhere, and a suspect one is never mailed.
 */
export const PANEL_SUSPECT = true;

/**
 * kitstart's `panelFlow`, on since the panel's `lead.created` has the flow
 * properties (panel v0.3.0). Every aquafix job is sold as a quote and the site
 * configures no flows, so its leads carry no `flow` — which the panel reads as
 * `quote`. A priced flow, once configured, sends its price with it.
 */
export const PANEL_FLOW = true;

/** kitstart's switches over what `lead.created` carries. */
export interface PanelSwitches {
  panelSuspect: boolean;
  panelFlow: boolean;
}

/** The job as the mail names it; a job the form no longer offers stays as posted. */
export const needLabel = (subject: string): string => jobLabelFr(subject) ?? subject;

/** How the site builds and signs its lead webhook; the switches are a parameter for the tests that flip them. */
export function webhookOptions(
  keyId: string,
  { panelSuspect, panelFlow }: PanelSwitches = { panelSuspect: PANEL_SUSPECT, panelFlow: PANEL_FLOW },
): LeadWebhookOptions {
  return {
    signing: SA_INGEST_SIGNING,
    panelSuspect,
    panelFlow,
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
