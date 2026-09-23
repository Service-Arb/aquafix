import { after } from "next/server";
import { copyFor } from "@/entities/content";
import { leadNotifier, openLeadStore, type LeadStore } from "@/entities/lead/server";
import { bakedPlace, contactOf, placeView } from "@/entities/place";
import { analyticsSink, EVENTS } from "@/features/analytics/events";
import { acceptLead, clientKey, RateLimiter } from "@/features/quote-form";
import { hostSlug } from "@/features/request-routing";
import { site } from "@/shared/config/site";
import { serverEnv } from "@/shared/config/env";
import type { Locale } from "@/shared/config/i18n";
import { THANKS } from "@/shared/landing/core/routing";

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
  store ??= openLeadStore(serverEnv().leadsDb);
  return store;
}

function seeOther(location: string): Response {
  return new Response(null, { status: 303, headers: { Location: location } });
}

/** Where a page of the submitting point is — or of the brand, with no point. */
function href(request: Request, slug: string | null, locale: Locale, suffix: string): string {
  const location = slug ? bakedPlace(slug) : undefined;
  if (!location) return `/${locale}${suffix}`;
  // Links follow the host the form was posted from: the point's subdomain, or
  // the apex fallback path.
  const mode = hostSlug(request.headers.get("host") ?? "") === location.slug ? "host" : "path";
  return placeView(location, locale, mode).href(suffix);
}

function unavailable(slug: string | null, locale: Locale): Response {
  const location = slug ? bakedPlace(slug) : undefined;
  const phone = location ? contactOf(location).phone : site.brand.phone;
  const copy = copyFor({ locale, place: location?.name[locale] ?? site.brand.name, phone });
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
  const outcome = await acceptLead(form, clientKey(request.headers), {
    insert: lead => leadStore().insert(lead),
    defer: task => after(task),
    notify: (lead, id) => notifier.notify(lead, id),
    capture: (lead, formId) =>
      analyticsSink({ key: env.posthogKey, host: env.posthogHost, brandId: site.brand.id }, lead.placeSlug).capture(
        EVENTS.leadSubmit,
        { form_id: formId },
      ),
    limiter,
    now: Date.now(),
    log: console,
  });

  switch (outcome.kind) {
    // A suspected bot is answered exactly as a person is.
    case "stored":
      return seeOther(href(request, outcome.lead.placeSlug, outcome.locale, THANKS));
    case "invalid":
      return seeOther(href(request, outcome.slug, outcome.locale, outcome.slug ? "#quote" : ""));
    case "failed":
      return unavailable(outcome.slug, outcome.locale);
  }
}
