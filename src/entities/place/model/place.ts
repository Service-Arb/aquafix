import { LOCALES, type Locale } from "@/shared/config/i18n";
import { site } from "@/shared/config/site";
import {
  createPlaceView,
  isPublished as isPublishedBy,
  parsePlaceLive,
  placeOrigin as placeOriginOn,
  placeUrl as placeUrlOn,
  publicationGaps as gapsBy,
  siteOrigin,
  type PublicationField,
} from "@/shared/landing/core/place";
import type { LinkMode } from "@/shared/landing/core/routing";
import type { Place, PlaceLive, PlaceView } from "./types";

/**
 * The place machinery bound to this site: its domain, its gate, its locales.
 * Everything below is the landing core with the site filled in, so the pages
 * keep calling `isPublished(place)` and never pass the policy by hand.
 */
export const PLACES: readonly Place[] = site.places;
export const PLACE_SLUGS: readonly string[] = site.placeSlugs;

export function bakedPlace(slug: string): Place | undefined {
  return PLACES.find(p => p.slug === slug);
}

export const brandOrigin = (): string => siteOrigin(site.brand.domain);
export const placeOrigin = (slug: string): string => placeOriginOn(site.brand.domain, slug);
export const placeUrl = (slug: string, locale: Locale, suffix: string): string =>
  placeUrlOn(site.brand.domain, slug, locale, suffix);

export function placeView(place: Place, locale: Locale, mode: LinkMode): PlaceView {
  return createPlaceView(site.brand.domain, place, locale, mode);
}

export const publicationGaps = (place: Place): PublicationField[] => gapsBy(place, site.publication);
export const isPublished = (place: Place): boolean => isPublishedBy(place, site.publication, site.brand);

export const parseLive = (body: unknown): PlaceLive => parsePlaceLive(body, LOCALES);

/** The numbers a point answers on: its own, or the card's until it has one. */
export function contactOf(place: Place): { phone: string; whatsapp: string } {
  return { phone: place.channels.phone ?? site.brand.phone, whatsapp: place.channels.whatsapp ?? site.brand.phone };
}
