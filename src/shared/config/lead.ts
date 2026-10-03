import { validateLead, type LeadCandidate, type LeadRejection, type LeadSchema } from "@evinvest/kitstart";

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
 * The one rule worth enforcing: a lead with no way to reach the customer is
 * not a lead. The phone is kitstart's rule — the one the form blocks on, so the
 * server never refuses a number the form let through (the landing contract
 * holds this to it); the commune is ours. A refusal names its field, which the
 * card shows the error at; `why` is for the log only, never rendered.
 */
export function quoteRule(lead: Pick<LeadCandidate, "locality" | "mobile">): LeadRejection | null {
  const phone = validateLead(lead);
  if (phone) return phone;
  if (lead.locality.trim() === "") return { field: "locality", why: "the town or postcode we would drive to" };
  return null;
}

/**
 * What a plumbing quote asks: the job, the commune or postcode, the mobile.
 * Posted as `job` / `zip` / `mobile`, the Rust form's names, which pages
 * cached before the port still send. The mobile is kept as E.164
 * (`+33612345678`) when it reads as a number — one spelling per customer for
 * the mail, the panel and a lookup — and as typed when it does not.
 */
export const LEAD: LeadSchema<JobId> = {
  subjects: JOB_IDS,
  wire: { subject: "job", locality: "zip", mobile: "mobile" },
  validate: quoteRule,
  mobileFormat: "e164",
};
