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

/**
 * `lead.created`'s `analytics_id` (the visit's PostHog id), sent when the form
 * posted one. On since the panel v0.4.0 takes the property (`LeadCreatedV1`
 * field 8). Should the site ship before that panel is in production, v0.3.0
 * refuses the unknown property and the real lead it rode on goes `dead` in the
 * outbox: once the panel is upgraded, `kitstart-outbox requeue` on the pod
 * sends it again. The declaration of the experiments needs no switch: the
 * panel keeps an unknown event type as unregistered and reads it once it
 * knows it.
 */
export const PANEL_ANALYTICS_ID = true;

/**
 * kitstart's `panelMessenger`: a WhatsApp or Telegram lead (`lead_channel`)
 * goes to the panel as its own channel, with `properties.message_ref` — the
 * reference the customer's chat carries, which the panel matches the chat to
 * (`LeadCreatedV1` field 9, panel `fen/messenger-leads`). On ahead of that
 * panel's release, as `PANEL_ANALYTICS_ID` was: the panel ships before the
 * sites (MESSENGER-CHANNELS-SPEC §5), and a panel without it refuses
 * `whatsapp` / `telegram` and parks the lead in the outbox until
 * `kitstart-outbox requeue`. Off, a messenger lead goes as a `form` without
 * its reference; the leads table and the mail keep both either way.
 */
export const PANEL_MESSENGER = true;

/** The switches over what `lead.created` carries: kitstart's three, and the site's own. */
export interface PanelSwitches {
  panelSuspect: boolean;
  panelFlow: boolean;
  panelAnalyticsId: boolean;
  panelMessenger: boolean;
}

const SWITCHES: PanelSwitches = {
  panelSuspect: PANEL_SUSPECT,
  panelFlow: PANEL_FLOW,
  panelAnalyticsId: PANEL_ANALYTICS_ID,
  panelMessenger: PANEL_MESSENGER,
};

/** The job as the mail names it; a job the form no longer offers stays as posted. */
export const needLabel = (subject: string): string => jobLabelFr(subject) ?? subject;

/**
 * How the site builds and signs its lead webhook; the switches are a
 * parameter for the tests that flip them, each one left out the site's own.
 */
export function webhookOptions(keyId: string, switches: Partial<PanelSwitches> = {}): LeadWebhookOptions {
  const { panelSuspect, panelFlow, panelAnalyticsId, panelMessenger } = { ...SWITCHES, ...switches };
  return {
    signing: SA_INGEST_SIGNING,
    panelSuspect,
    panelFlow,
    panelMessenger,
    buildBody: (lead, ctx) => leadCreatedBody(lead, ctx, { sourceId: keyId, needLabel, analyticsId: panelAnalyticsId }),
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
