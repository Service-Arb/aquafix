import "server-only";
import { headers } from "next/headers";
import { copyFor, type Copy } from "@/entities/content";
import { bakedLocation, pointFor } from "@/entities/location";
import { BRAND } from "@/shared/config/brand";
import { DEFAULT_LOCALE, isLocale, perLocale } from "@/shared/config/i18n";
import { LOCATION_MODE_HEADER, ROUTE_HEADER } from "@/shared/config/routes";
import type { StatusTarget } from "@/widgets/status-screen";

/**
 * A 404 still answers in the page's language with the right phone. `not-found`
 * gets no params, so the proxy's record of where it routed the request is
 * read instead; a dead URL has no twin in the other language, so the switch
 * goes home.
 */
export async function loadNotFound(): Promise<{ copy: Copy; target: StatusTarget }> {
  const h = await headers();
  const [, first, second] = (h.get(ROUTE_HEADER) ?? "").split("/");
  const locale = isLocale(first) ? first : DEFAULT_LOCALE;
  const baked = second ? bakedLocation(second) : undefined;
  if (baked) {
    const point = pointFor(baked, locale, h.get(LOCATION_MODE_HEADER) === "host" ? "host" : "path");
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
