import {
  bakedPlace as bakedOn,
  contactOf as contactOn,
  createPlaceView,
  isPublished as isPublishedBy,
  parsePlaceLive,
  placeOrigin as placeOriginOn,
  placeUrl as placeUrlOn,
  publicationGaps as gapsBy,
  siteOrigin,
  type LinkMode,
  type PublicationField,
} from "@evinvest/kitstart";
import { LOCALES, type Locale } from "@/shared/config/i18n";
import { CARD, site } from "@/shared/config/site";
import type { Place, PlaceLive, PlaceView } from "./types";

/**
 * The place machinery bound to this site: its domain, its gate, its locales.
 * Everything below is kitstart with the site filled in, so the pages keep
 * calling `isPublished(place)` and never pass the policy by hand.
 */
export const PLACES: readonly Place[] = site.places;
export const PLACE_SLUGS: readonly string[] = site.placeSlugs;

export function bakedPlace(slug: string): Place | undefined {
  return bakedOn(site, slug);
}

/** An origin of a site with a domain; the card always carries one. */
function known(origin: string | null): string {
  if (origin === null) throw new Error("site.brand.domain is empty — assets/card.toml must name the site");
  return origin;
}

export const brandOrigin = (): string => known(siteOrigin(site));
export const placeOrigin = (slug: string): string => known(placeOriginOn(site, slug));
export const placeUrl = (slug: string, locale: Locale, suffix: string): string => placeUrlOn(site, slug, locale, suffix);

export function placeView(place: Place, locale: Locale, mode: LinkMode): PlaceView {
  return createPlaceView(site, place, locale, mode);
}

export const publicationGaps = (place: Place): PublicationField[] => gapsBy(place, site.publication);
export const isPublished = (place: Place): boolean => isPublishedBy(place, site.publication, site.brand);

export const parseLive = (body: unknown): PlaceLive => parsePlaceLive(body, LOCALES);

/** The numbers a point answers on: its own, or the card's until it has one. */
export function contactOf(place: Place): { phone: string; whatsapp: string } {
  const own = contactOn(site, place);
  return { phone: own.phone ?? CARD.phone, whatsapp: own.whatsapp ?? CARD.phone };
}
