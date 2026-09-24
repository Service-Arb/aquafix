import "server-only";
import { createPlaceLoader, type PlaceParams } from "@evinvest/kitstart/next";
import { copyFor, type Copy } from "@/entities/content";
import { contactOf, type PlaceView } from "@/entities/place";
import { placeSource } from "@/entities/place/server";
import { site } from "@/shared/config/site";

export type LocationParams = PlaceParams;

/**
 * The point and how its links are written, from the route params alone: the
 * link mode rides in the `[location]` param (`_royat` on the point's own
 * host), so the page reads nothing from the request and is cached (ISR).
 * `notFound()` for an unknown language or point; the baked point when the
 * live source fails. Memoised per render.
 */
const loadPlaceView = createPlaceLoader(site, placeSource);

/** The point and the words for one page: the entity's view and its copy, composed here. */
export async function loadPoint(params: Promise<LocationParams>): Promise<{ point: PlaceView; copy: Copy }> {
  const point = await loadPlaceView(params);
  const { place, locale } = point;
  return { point, copy: copyFor({ locale, place: place.name[locale], phone: contactOf(place).phone }) };
}
