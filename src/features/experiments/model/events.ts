import { createBeaconSink, type AnalyticsSink } from "@evinvest/analytics";
import type { AnalyticsTarget } from "@evinvest/kitstart";

/**
 * The A/B events. kitstart's own (`location_page_view`, `contact_intent_click`,
 * `lead_form_submit`) drop any property off its allow-list, `variant`
 * included, so the tests speak through a sink of their own — same key, same
 * host, same cookieless beacon. The beacon's `distinct_id` is new on every
 * page load, so an exposure and a lead are never joined per person: the
 * funnel in PostHog compares per-variant totals (docs/EXPERIMENTS.md).
 */
export const EXPERIMENT_EVENTS = {
  /** A location page seen under a variant; once per page view per test. */
  exposed: "experiment_exposed",
  /** A tap on `tel:` or `wa.me`, or a link that opens the form. */
  contact: "experiment_contact",
  /** A lead the store accepted (server side, from `/quote`). */
  lead: "experiment_lead",
} as const;

export type ExperimentChannel = "phone" | "whatsapp" | "form_open";

/** Nothing a visitor typed can reach PostHog: the sink drops any other name. */
export const EXPERIMENT_PROPS = ["brand_id", "location_id", "experiment", "variant", "channel", "forced", "superseded", "channels_available"] as const;

/**
 * `channels_available` on an exposure or a lead: the messengers the card
 * offered (`wa,tg` | `wa` | `tg` | `none`), so `lead_channel` reads only where
 * it ran; absent on a page without the card.
 */
export function channelsProp(channels: string | null): { channels_available?: string } {
  return channels !== null && /^(wa,tg|wa|tg|none)$/.test(channels) ? { channels_available: channels } : {};
}

/** `superseded: true` on an event of a test whose arm the page did not draw (`isSuperseded`); absent otherwise. */
export function supersededProp(superseded: boolean): { superseded?: true } {
  return superseded ? { superseded: true } : {};
}

export function experimentSink(target: AnalyticsTarget, locationId: string | null): AnalyticsSink {
  return createBeaconSink({
    key: target.key ?? undefined,
    host: target.host,
    allowedProps: EXPERIMENT_PROPS,
    globalProps: locationId ? { brand_id: target.brandId, location_id: locationId } : { brand_id: target.brandId },
  });
}
