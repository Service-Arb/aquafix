import { after } from "next/server";
import { copyFor } from "@/entities/content";
import { leadNotifier, openLeadStore, type LeadStore } from "@/entities/lead/server";
import { bakedLocation, pointFor } from "@/entities/location";
import { analyticsSink, EVENTS } from "@/features/analytics/events";
import { acceptLead, RateLimiter } from "@/features/quote-form";
import { hostSlug } from "@/features/request-routing";
import { serverEnv } from "@/shared/config/env";
import type { Locale } from "@/shared/config/i18n";
import { THANKS } from "@/shared/config/routes";

/**
 * The no-JS path, and the one that has to keep working: a plain form POST
 * answered with a 303, so a refresh does not resubmit.
 */
export const dynamic = "force-dynamic";

/** The Rust server's body limit; a quote is three short fields. */
const MAX_BODY = 64 * 1024;
const limiter = new RateLimiter(5, 10 * 60_000);

let store: LeadStore | undefined;
function leadStore(): LeadStore {
  // Opened on first use rather than at import: `next build` imports this file.
  store ??= openLeadStore(serverEnv().leadsDbPath);
  return store;
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

function seeOther(location: string): Response {
  return new Response(null, { status: 303, headers: { Location: location } });
}

function unavailable(slug: string, locale: Locale): Response {
  const location = bakedLocation(slug);
  const copy = copyFor({ locale, place: location?.place[locale] ?? "", phone: location?.phone ?? "" });
  const s = copy.t.serverError;
  const tel = `tel:${copy.f.phone.replace(/[^\d+]/g, "")}`;
  // Self-contained: the thing that failed may be the thing that renders pages.
  const html = `<!doctype html><html lang="${locale}"><meta charset="utf-8"><meta name="robots" content="noindex"><title>${s.title}</title><body style="font-family:system-ui;max-width:36rem;margin:4rem auto;padding:0 1.25rem"><h1>${s.headline.join("")}</h1><p>${s.body(copy.f)}</p><p><a href="${tel}">${copy.t.callLabel(copy.f)}</a></p></body></html>`;
  return new Response(html, { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function POST(request: Request): Promise<Response> {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) return new Response(null, { status: 413 });
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response(null, { status: 400 });
  }
  const env = serverEnv();
  const notifier = leadNotifier(env);
  const outcome = acceptLead(form, clientKey(request), {
    insert: lead => leadStore().insert(lead),
    defer: task => after(task),
    notify: (lead, id) => notifier.notify(lead, id),
    capture: (lead, formId) =>
      analyticsSink({ key: env.posthogKey, host: env.posthogHost }, lead.locationId).capture(EVENTS.leadSubmit, {
        form_id: formId,
      }),
    limiter,
    now: Date.now(),
    log: console,
  });

  if (outcome.kind === "unknown-location") return new Response(null, { status: 400 });
  const slug = outcome.kind === "stored" ? outcome.lead.locationId : outcome.slug;
  const location = bakedLocation(slug);
  if (!location) return new Response(null, { status: 400 });
  // Links follow the host the form was posted from: the point's subdomain, or
  // the apex fallback path.
  const mode = hostSlug(request.headers.get("host") ?? "") === slug ? "host" : "path";
  const point = pointFor(location, outcome.locale, mode);

  switch (outcome.kind) {
    case "stored":
    // A bot is answered exactly as a person is.
    case "spam":
      return seeOther(point.href(THANKS));
    case "invalid":
      return seeOther(point.href("#quote"));
    case "failed":
      return unavailable(slug, outcome.locale);
  }
}
