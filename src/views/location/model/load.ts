import "server-only";
import { notFound } from "next/navigation";
import { copyFor, type Copy } from "@/entities/content";
import { contactOf, placeView, type PlaceView } from "@/entities/place";
import { getPlace } from "@/entities/place/server";
import { isLocale } from "@/shared/config/i18n";
import { parsePlaceParam } from "@evinvest/kitstart";

export interface LocationParams {
  locale: string;
  location: string;
}

/**
 * The point and the words for one page. `notFound()` for an unknown language
 * or point — a real 404 with `noindex`; a failing live source serves the
 * baked point (see `getPlace`).
 *
 * Reads nothing from the request: the link mode is in the param (see
 * `HOST_MARK`), so the page is static per path and cached (ISR) on the live
 * data's TTL.
 */
export async function loadPoint(params: Promise<LocationParams>): Promise<{ point: PlaceView; copy: Copy }> {
  const { locale, location: param } = await params;
  if (!isLocale(locale)) notFound();
  const { slug, mode } = parsePlaceParam(param);
  const location = await getPlace(slug, locale);
  if (!location) notFound();
  return {
    point: placeView(location, locale, mode),
    copy: copyFor({ locale, place: location.name[locale], phone: contactOf(location).phone }),
  };
}
