import { LOCATION_SLUGS } from "@/entities/location";
import { validateLead, type Lead } from "@/entities/lead";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/shared/config/i18n";
import { HONEYPOT_FIELD, RENDERED_AT_FIELD, screen, type RateLimiter } from "./antispam";

/** Hidden fields the form carries besides what the visitor types. */
export const LOCATION_FIELD = "location";
export const LOCALE_FIELD = "locale";
export const FORM_ID_FIELD = "form_id";

/** A field is capped, not rejected: a long answer is still a customer. */
const MAX_FIELD = 200;

export type Outcome =
  | { kind: "stored"; id: number; lead: Lead; locale: Locale; formId: string }
  | { kind: "invalid"; why: string; locale: Locale; slug: string | null }
  | { kind: "failed"; locale: Locale; slug: string | null };

export interface AcceptDeps {
  insert: (lead: Lead) => number;
  /** Runs after the response is sent; see the route handler. */
  defer: (task: () => Promise<void> | void) => void;
  notify: (lead: Lead, id: number) => Promise<void>;
  capture: (lead: Lead, formId: string) => void;
  limiter: RateLimiter;
  now: number;
  log: Pick<Console, "warn" | "error">;
}

function field(form: FormData, name: string): string | null {
  const value = form.get(name);
  return typeof value === "string" ? value.trim().slice(0, MAX_FIELD) : null;
}

/**
 * The funnel's commit point, independent of HTTP. Order is the invariant:
 * validate → screen → **insert** → (deferred) notify and capture.
 *
 * Nothing that passes validation is thrown away. A submission the barriers
 * suspect is stored with its `spamVerdict` and simply not notified: a
 * mis-set clock, a fast thumb or a shared carrier NAT must not cost a real
 * customer, and a reviewer can still find the row. A lead with no point, or
 * one we no longer have (an old page, a stale form), is stored without one.
 *
 * A notification failure logs and changes nothing; a store failure is
 * `failed`, never `stored` — a thank-you page for a lead that was never
 * written is the worst outcome this system can produce.
 */
export function acceptLead(form: FormData, clientKey: string, deps: AcceptDeps): Outcome {
  const rawSlug = field(form, LOCATION_FIELD);
  const slug = rawSlug && LOCATION_SLUGS.includes(rawSlug) ? rawSlug : null;
  const rawLocale = field(form, LOCALE_FIELD);
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  const candidate = {
    job: field(form, "job") ?? "",
    zip: field(form, "zip") ?? "",
    mobile: field(form, "mobile") ?? "",
    locationId: slug,
  };
  const why = validateLead(candidate);
  if (why) {
    deps.log.warn(`quote: rejected a submission for ${slug ?? "no point"}: missing ${why}`);
    return { kind: "invalid", why, locale, slug };
  }

  // After validation, so a typo corrected and resent does not spend the limit.
  const verdict = screen({
    honeypot: field(form, HONEYPOT_FIELD),
    renderedAt: field(form, RENDERED_AT_FIELD),
    clientKey,
    now: deps.now,
    limiter: deps.limiter,
  });
  const lead: Lead = { ...candidate, spamVerdict: verdict === "ok" ? null : verdict };

  let id: number;
  try {
    id = deps.insert(lead);
  } catch (error) {
    deps.log.error(`quote: the lead store rejected a submission for ${slug ?? "no point"}`, error);
    return { kind: "failed", locale, slug };
  }

  const formId = field(form, FORM_ID_FIELD) ?? "quote";
  // The render stamp comes from the client, so it only marks: a `too-fast`
  // lead (or one from a page cached before the stamp existed) is still sent
  // on, flagged. The honeypot and the rate limit are the server's own
  // evidence, and those leads wait in the table for a reviewer.
  if (lead.spamVerdict && lead.spamVerdict !== "too-fast") {
    deps.log.warn(`quote: lead ${id} stored as suspected spam (${lead.spamVerdict}); not notified`);
    return { kind: "stored", id, lead, locale, formId };
  }
  deps.defer(async () => {
    try {
      await deps.notify(lead, id);
    } catch (error) {
      deps.log.error(`quote: lead ${id} is stored but its notification failed`, error);
    }
  });
  deps.defer(() => deps.capture(lead, formId));
  return { kind: "stored", id, lead, locale, formId };
}

