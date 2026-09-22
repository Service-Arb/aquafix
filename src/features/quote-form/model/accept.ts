import { LOCATION_SLUGS } from "@/entities/location";
import { validateLead, type Lead } from "@/entities/lead";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/shared/config/i18n";
import { HONEYPOT_FIELD, RENDERED_AT_FIELD, screen, type RateLimiter, type SpamVerdict } from "./antispam";

/** Hidden fields the form carries besides what the visitor types. */
export const LOCATION_FIELD = "location";
export const LOCALE_FIELD = "locale";
export const FORM_ID_FIELD = "form_id";

/** A field is capped, not rejected: a long answer is still a customer. */
const MAX_FIELD = 200;

export type Outcome =
  | { kind: "stored"; id: number; lead: Lead; locale: Locale; formId: string }
  | { kind: "invalid"; why: string; locale: Locale; slug: string }
  | { kind: "spam"; verdict: Exclude<SpamVerdict, "ok">; locale: Locale; slug: string }
  | { kind: "failed"; locale: Locale; slug: string }
  | { kind: "unknown-location" };

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
 * screen → validate → **insert** → (deferred) notify and capture. A lead is
 * durable before the visitor is told their price is coming; a notification
 * failure after that logs and changes nothing; a store failure is `failed`,
 * never `stored` — a thank-you page for a lead that was never written is the
 * worst outcome this system can produce.
 */
export function acceptLead(form: FormData, clientKey: string, deps: AcceptDeps): Outcome {
  const slug = field(form, LOCATION_FIELD) ?? "";
  if (!LOCATION_SLUGS.includes(slug)) return { kind: "unknown-location" };
  const rawLocale = field(form, LOCALE_FIELD);
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  const verdict = screen({
    honeypot: field(form, HONEYPOT_FIELD),
    renderedAt: field(form, RENDERED_AT_FIELD),
    clientKey,
    now: deps.now,
    limiter: deps.limiter,
  });
  if (verdict !== "ok") {
    deps.log.warn(`quote: dropped a submission (${verdict}) for ${slug}`);
    return { kind: "spam", verdict, locale, slug };
  }

  const lead: Lead = {
    job: field(form, "job") ?? "",
    zip: field(form, "zip") ?? "",
    mobile: field(form, "mobile") ?? "",
    locationId: slug,
  };
  const why = validateLead(lead);
  if (why) {
    deps.log.warn(`quote: rejected a submission for ${slug}: missing ${why}`);
    return { kind: "invalid", why, locale, slug };
  }

  let id: number;
  try {
    id = deps.insert(lead);
  } catch (error) {
    deps.log.error(`quote: the lead store rejected a submission for ${slug}`, error);
    return { kind: "failed", locale, slug };
  }

  const formId = field(form, FORM_ID_FIELD) ?? "quote";
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
