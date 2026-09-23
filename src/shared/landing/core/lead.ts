/**
 * The lead as data. Every landing asks for a subject (what the job is), a
 * locality (where to go) and a mobile (how to answer); what else it asks for
 * is the brand's `extras`, and what it refuses is the brand's `validate`. The
 * funnel's order — validate → screen → insert → deferred notify — is the
 * machinery's, not the schema's.
 */

/** Why a submission was kept but not acted on. `null` is a clean lead. */
export type SpamVerdict = "honeypot" | "too-fast" | "rate-limited";

/** One more field a brand's form asks for, capped at `max` characters. */
export interface LeadExtra {
  name: string;
  max: number;
}

/**
 * The form field each core value is posted under. Brand config, not a
 * constant: a page cached before a rename still posts the old names, and a
 * lead from it is still a customer.
 */
export interface LeadWire {
  subject: string;
  locality: string;
  mobile: string;
}

export interface LeadSchema<S extends string> {
  /** What the form's subject control offers, in order. */
  subjects: readonly S[];
  wire: LeadWire;
  extras?: readonly LeadExtra[];
  /**
   * The one rule worth enforcing, as a reason for the log (never rendered), or
   * `null` to accept. Absent → every candidate is a lead.
   */
  validate?: (lead: LeadCandidate) => string | null;
}

/**
 * A submitted lead. Values are trimmed and capped but not otherwise parsed: a
 * lead that cannot be fully validated is still a lead, and rejecting it loses
 * a customer to protect a column type. `subject` is kept as posted even when
 * it is not one of `subjects` — a stale form's value is still a job.
 */
export interface Lead {
  subject: string;
  locality: string;
  mobile: string;
  extras: Readonly<Record<string, string>>;
  /** The place it was submitted from — its slug — or `null` when unknown. */
  placeSlug: string | null;
  spamVerdict: SpamVerdict | null;
}

export type LeadCandidate = Omit<Lead, "spamVerdict">;

/** A field is capped, not rejected: a long answer is still a customer. */
export const MAX_FIELD = 200;

function field(form: FormData, name: string, max: number): string | null {
  const value = form.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : null;
}

/** The candidate a form posted, read through the schema's field names. */
export function readCandidate(
  schema: LeadSchema<string>,
  form: FormData,
  placeSlug: string | null,
): LeadCandidate {
  const extras: Record<string, string> = {};
  for (const extra of schema.extras ?? []) {
    const value = field(form, extra.name, Math.min(extra.max, MAX_FIELD));
    if (value) extras[extra.name] = value;
  }
  return {
    subject: field(form, schema.wire.subject, MAX_FIELD) ?? "",
    locality: field(form, schema.wire.locality, MAX_FIELD) ?? "",
    mobile: field(form, schema.wire.mobile, MAX_FIELD) ?? "",
    extras,
    placeSlug,
  };
}

export function validateCandidate(schema: LeadSchema<string>, lead: LeadCandidate): string | null {
  return schema.validate?.(lead) ?? null;
}
