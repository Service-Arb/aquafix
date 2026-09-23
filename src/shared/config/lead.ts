import type { LeadCandidate, LeadSchema } from "@/shared/landing/core/lead";

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
 * not a lead. The reason is a diagnostic for the log, never rendered, so it
 * stays out of the copy and out of the language seam.
 */
export function validateLead(lead: Pick<LeadCandidate, "locality" | "mobile">): string | null {
  // Ten digits is a French national number (06 12 34 56 78); +33 6… is eleven.
  if (lead.mobile.replace(/\D/g, "").length < 10) return "a mobile number we can text the price to";
  if (lead.locality.trim() === "") return "the town or postcode we would drive to";
  return null;
}

/**
 * What a plumbing quote asks: the job, the commune or postcode, the mobile.
 * Posted as `job` / `zip` / `mobile`, the Rust form's names, which pages
 * cached before the port still send.
 */
export const LEAD: LeadSchema<JobId> = {
  subjects: JOB_IDS,
  wire: { subject: "job", locality: "zip", mobile: "mobile" },
  validate: validateLead,
};
