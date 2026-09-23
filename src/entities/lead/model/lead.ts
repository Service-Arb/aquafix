/** Why a submission was kept but not acted on. `null` is a clean lead. */
export type SpamVerdict = "honeypot" | "too-fast" | "rate-limited";

/**
 * A submitted lead. `zip` and `mobile` are trimmed but not otherwise parsed: a
 * lead we cannot fully validate is still a lead, and rejecting it loses a
 * customer to protect a column type.
 */
export interface Lead {
  job: string;
  zip: string;
  mobile: string;
  /** The point it was submitted from — its slug — or `null` when unknown. */
  locationId: string | null;
  spamVerdict: SpamVerdict | null;
}

/**
 * The one rule worth enforcing: a lead with no way to reach the customer is
 * not a lead. The reason is a diagnostic for the log, never rendered, so it
 * stays out of the copy and out of the language seam.
 */
export function validateLead(lead: Pick<Lead, "zip" | "mobile">): string | null {
  // Ten digits is a French national number (06 12 34 56 78); +33 6… is eleven.
  if (lead.mobile.replace(/\D/g, "").length < 10) return "a mobile number we can text the price to";
  if (lead.zip.trim() === "") return "the town or postcode we would drive to";
  return null;
}
