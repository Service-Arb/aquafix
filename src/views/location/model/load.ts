import "server-only";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { copyFor, type Copy } from "@/entities/content";
import { pointFor, type Point } from "@/entities/location";
import { getLocation } from "@/entities/location/server";
import { isLocale } from "@/shared/config/i18n";
import { LOCATION_MODE_HEADER } from "@/shared/config/routes";

export interface LocationParams {
  locale: string;
  location: string;
}

/**
 * The point and the words for one request. `notFound()` for an unknown
 * language or point — a real 404 with `noindex`; a failing live source throws
 * from `getLocation`, so the error boundary answers 500 instead.
 */
export async function loadPoint(params: Promise<LocationParams>): Promise<{ point: Point; copy: Copy }> {
  const { locale, location: slug } = await params;
  if (!isLocale(locale)) notFound();
  const location = await getLocation(slug, locale);
  if (!location) notFound();
  // Set only by the proxy, which strips any client-sent value.
  const mode = (await headers()).get(LOCATION_MODE_HEADER) === "host" ? "host" : "path";
  return {
    point: pointFor(location, locale, mode),
    copy: copyFor({ locale, place: location.place[locale], phone: location.phone }),
  };
}
