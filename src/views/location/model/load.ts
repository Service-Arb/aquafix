import "server-only";
import { notFound } from "next/navigation";
import { copyFor, type Copy } from "@/entities/content";
import { pointFor, type Point } from "@/entities/location";
import { getLocation } from "@/entities/location/server";
import { isLocale } from "@/shared/config/i18n";
import { parseLocationParam } from "@/shared/config/routes";

export interface LocationParams {
  locale: string;
  location: string;
}

/**
 * The point and the words for one page. `notFound()` for an unknown language
 * or point — a real 404 with `noindex`; a failing live source throws from
 * `getLocation`, so the error boundary answers 500 instead.
 *
 * Reads nothing from the request: the link mode is in the param (see
 * `HOST_MARK`), so the page is static per path and cached (ISR) on the live
 * data's TTL.
 */
export async function loadPoint(params: Promise<LocationParams>): Promise<{ point: Point; copy: Copy }> {
  const { locale, location: param } = await params;
  if (!isLocale(locale)) notFound();
  const { slug, mode } = parseLocationParam(param);
  const location = await getLocation(slug, locale);
  if (!location) notFound();
  return {
    point: pointFor(location, locale, mode),
    copy: copyFor({ locale, place: location.place[locale], phone: location.phone }),
  };
}
