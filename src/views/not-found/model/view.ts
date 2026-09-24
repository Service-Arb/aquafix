import { statusTarget } from "@evinvest/kitstart";
import { copyFor, type Copy } from "@/entities/content";
import { contactOf } from "@/entities/place";
import { CARD, site } from "@/shared/config/site";
import type { StatusTarget } from "@/widgets/status-screen";

/**
 * A 404 still answers in the page's language with the right phone. The
 * not-found boundary gets no params from Next, so it passes the route params
 * the client sees (`useParams`); the 404 route passes the proxy's. kitstart's
 * `statusTarget` reads the link mode out of the location param (`_royat` on a
 * point's subdomain); an unknown point answers for the brand, and the language
 * switch goes home — a dead URL has no twin in the other language.
 *
 * No request data: the boundary is rendered into every page's payload, and a
 * `headers()` here would turn every cached page back into a per-request one.
 */
export function notFoundView(params: { locale?: string | undefined; location?: string | undefined }): {
  copy: Copy;
  target: StatusTarget;
} {
  const { locale, place, home, retry, langHrefs } = statusTarget(site, params);
  const phone = place ? contactOf(place).phone : CARD.phone;
  return {
    copy: copyFor({ locale, place: place?.name[locale] ?? site.brand.name, phone }),
    target: { phone, home, retry, langHrefs },
  };
}
