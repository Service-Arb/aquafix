import { copyFor, type Copy } from "@/entities/content";
import { bakedPlace, contactOf, placeView } from "@/entities/place";
import { DEFAULT_LOCALE, isLocale, perLocale } from "@/shared/config/i18n";
import { site } from "@/shared/config/site";
import { parseLocationParam } from "@/shared/landing/core/routing";
import type { StatusTarget } from "@/widgets/status-screen";

/**
 * A 404 still answers in the page's language with the right phone. The
 * not-found boundary gets no params from Next, so it passes the route params
 * the client sees (`useParams`); the 404 route passes its own. The link mode
 * rides in the location param (`_royat` on a point's subdomain); an unknown
 * point answers for the brand. A dead URL has no twin in the other language,
 * so the switch goes home.
 *
 * No request data: the boundary is rendered into every page's payload, and a
 * `headers()` here would turn every cached page back into a per-request one.
 */
export function notFoundView(params: { locale?: string | undefined; location?: string | undefined }): {
  copy: Copy;
  target: StatusTarget;
} {
  const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const { slug, mode } = parseLocationParam(params.location ?? "");
  const baked = slug ? bakedPlace(slug) : undefined;
  if (baked) {
    const { phone } = contactOf(baked);
    const point = placeView(baked, locale, mode);
    return {
      copy: copyFor({ locale, place: baked.name[locale], phone }),
      target: { phone, home: point.href(""), retry: point.href(""), langHrefs: perLocale(l => point.href("", l)) },
    };
  }
  return {
    copy: copyFor({ locale, place: site.brand.name, phone: site.brand.phone }),
    target: { phone: site.brand.phone, home: `/${locale}`, retry: `/${locale}`, langHrefs: perLocale(l => `/${l}`) },
  };
}
