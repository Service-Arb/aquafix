import { copyFor, type Copy } from "@/entities/content";
import { bakedLocation, pointFor } from "@/entities/location";
import { BRAND } from "@/shared/config/brand";
import { DEFAULT_LOCALE, isLocale, perLocale } from "@/shared/config/i18n";
import { parseLocationParam } from "@/shared/config/routes";
import type { StatusTarget } from "@/widgets/status-screen";

/**
 * A 404 still answers in the page's language with the right phone. The
 * not-found boundary gets no params from Next, so this reads the route params
 * the client sees (`useParams`) — the link mode rides in the location param
 * (`_royat` on a point's subdomain). A dead URL has no twin in the other
 * language, so the switch goes home.
 *
 * No request data: the boundary is rendered into every page's payload, and a
 * `headers()` here would turn every cached page back into a per-request one.
 */
export function notFoundView(params: { locale?: string; location?: string }): { copy: Copy; target: StatusTarget } {
  const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const { slug, mode } = parseLocationParam(params.location ?? "");
  const baked = slug ? bakedLocation(slug) : undefined;
  if (baked) {
    const point = pointFor(baked, locale, mode);
    return {
      copy: copyFor({ locale, place: baked.place[locale], phone: baked.phone }),
      target: { phone: baked.phone, home: point.href(""), retry: point.href(""), langHrefs: perLocale(l => point.href("", l)) },
    };
  }
  return {
    copy: copyFor({ locale, place: BRAND.name, phone: BRAND.phone }),
    target: { phone: BRAND.phone, home: `/${locale}`, retry: `/${locale}`, langHrefs: perLocale(l => `/${l}`) },
  };
}
