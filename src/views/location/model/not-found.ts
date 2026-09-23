import "server-only";
import { headers } from "next/headers";
import { copyFor, type Copy } from "@/entities/content";
import { bakedLocation, pointFor } from "@/entities/location";
import { site } from "@/shared/config/site";
import { DEFAULT_LOCALE, isLocale, perLocale } from "@/shared/config/i18n";
import type { StatusTarget } from "@/widgets/status-screen";

/**
 * A 404 still answers in the page's language with the right phone. `not-found`
 * gets no params, so the proxy's record of where it routed the request is
 * read instead; a dead URL has no twin in the other language, so the switch
 * goes home.
 */
export async function loadNotFound(): Promise<{ copy: Copy; target: StatusTarget }> {
  const h = await headers();
  const [, first, second] = (h.get(site.headers.route) ?? "").split("/");
  const locale = isLocale(first) ? first : DEFAULT_LOCALE;
  const baked = second ? bakedLocation(second) : undefined;
  if (baked) {
    const point = pointFor(baked, locale, h.get(site.headers.linkMode) === "host" ? "host" : "path");
    return {
      copy: copyFor({ locale, place: baked.place[locale], phone: baked.phone }),
      target: { phone: baked.phone, home: point.href(""), retry: point.href(""), langHrefs: perLocale(l => point.href("", l)) },
    };
  }
  return {
    copy: copyFor({ locale, place: site.brand.name, phone: site.brand.phone }),
    target: { phone: site.brand.phone, home: `/${locale}`, retry: `/${locale}`, langHrefs: perLocale(l => `/${l}`) },
  };
}
