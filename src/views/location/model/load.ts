import "server-only";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { copyFor, type Copy } from "@/entities/content";
import { contactOf, placeView, type PlaceView } from "@/entities/place";
import { getPlace } from "@/entities/place/server";
import { isLocale } from "@/shared/config/i18n";
import { site } from "@/shared/config/site";

export interface LocationParams {
  locale: string;
  location: string;
}

/**
 * The point and the words for one request. `notFound()` for an unknown
 * language or point — a real 404 with `noindex`; a failing live source throws
 * from `getPlace`, so the error boundary answers 500 instead.
 */
export async function loadPoint(params: Promise<LocationParams>): Promise<{ point: PlaceView; copy: Copy }> {
  const { locale, location: slug } = await params;
  if (!isLocale(locale)) notFound();
  const location = await getPlace(slug, locale);
  if (!location) notFound();
  // Set only by the proxy, which strips any client-sent value.
  const mode = (await headers()).get(site.headers.linkMode) === "host" ? "host" : "path";
  return {
    point: placeView(location, locale, mode),
    copy: copyFor({ locale, place: location.name[locale], phone: contactOf(location).phone }),
  };
}
