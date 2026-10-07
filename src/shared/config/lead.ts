import { isMessengerChannel, validateLead, type LeadCandidate, type LeadRejection, type LeadSchema } from "@evinvest/kitstart";

/** Values the quote form's `<select>` posts and the lead store keeps. */
export const JOB_IDS = [
  "blocked_drain",
  "burst_pipe",
  "hot_water",
  "tap_toilet",
  "sewer_line",
  "leak_detection",
  "repipe",
  "fit_out",
  "other",
] as const;
export type JobId = (typeof JOB_IDS)[number];

/**
 * How soon the customer needs the plumber: the first question of
 * `lead_form` `c` (docs/EXPERIMENTS.md), posted as the extra `urgency`.
 * `today` turns the form into a call-back request.
 */
export const URGENCIES = ["today", "week", "compare"] as const;
export type Urgency = (typeof URGENCIES)[number];
export const URGENCY_FIELD = "urgency";

/**
 * What `lead_channel` `g` (AQ-6, "C’est urgent ?") posts under the same
 * extra: kitstart's `today` (a call) or `later` (the WhatsApp message). Its
 * `today` is this brand's; `later` is the kit's own word for "not urgent".
 */
export const URGENCY_LATER = "later";

/**
 * The one rule worth enforcing: a lead with no way to reach the customer is
 * not a lead. The phone is kitstart's rule — the one the form blocks on, so the
 * server never refuses a number the form let through (the landing contract
 * holds this to it); the commune is ours. A refusal names its field, which the
 * card shows the error at; `why` is for the log only, never rendered.
 *
 * A WhatsApp or Telegram lead is reached in the chat: kitstart asks it no
 * phone (one typed is still held to the rule), and the commune is not asked
 * either — the message carries it when it was filled.
 */
export function quoteRule(lead: Pick<LeadCandidate, "locality" | "mobile" | "channel">): LeadRejection | null {
  const phone = validateLead(lead);
  if (phone) return phone;
  if (isMessengerChannel(lead.channel)) return null;
  if (lead.locality.trim() === "") return { field: "locality", why: "the town or postcode we would drive to" };
  return null;
}

/**
 * What a plumbing quote asks: the job, the commune or postcode, the mobile —
 * and, in one arm of `lead_form`, how urgent it is.
 * Posted as `job` / `zip` / `mobile`, the Rust form's names, which pages
 * cached before the port still send. The mobile is kept as E.164
 * (`+33612345678`) when it reads as a number — one spelling per customer for
 * the mail, the panel and a lookup — and as typed when it does not.
 */
export const LEAD: LeadSchema<JobId> = {
  subjects: JOB_IDS,
  wire: { subject: "job", locality: "zip", mobile: "mobile" },
  // Declared, or the server drops what the intro question posts.
  extras: [{ name: URGENCY_FIELD, max: 16 }],
  validate: quoteRule,
  mobileFormat: "e164",
};
