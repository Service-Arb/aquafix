import type { LinkMode } from "../routing";
import type { Place } from "./types";

/**
 * A place as one request sees it: the merged record, the language, and how its
 * links are written on this host. Sections take this instead of eight props.
 */
export interface PlaceView<L extends string> {
  place: Place<L>;
  locale: L;
  mode: LinkMode;
  /** Root-relative link to one of this place's pages in `locale`. */
  href: (suffix: string, locale?: L) => string;
  /** Absolute canonical URL (always the subdomain). */
  url: (suffix: string, locale?: L) => string;
}

export const siteOrigin = (domain: string): string => `https://${domain}`;

/** The canonical home of a place is its subdomain, whichever URL served it. */
export const placeOrigin = (domain: string, slug: string): string => `https://${slug}.${domain}`;

/** Absolute canonical URL of a place's page. */
export function placeUrl(domain: string, slug: string, locale: string, suffix: string): string {
  return `${placeOrigin(domain, slug)}/${locale}${suffix}`;
}

/** Where a place's pages link to, given how this request reached it. */
export interface LinkBase {
  mode: LinkMode;
  slug: string;
}

/**
 * A root-relative href to one of the place's pages. `suffix` is a page suffix
 * and may carry a fragment: `"#quote"`, `"/prices#faq"`.
 */
export function placeHref(base: LinkBase, locale: string, suffix: string): string {
  const prefix = base.mode === "host" ? `/${locale}` : `/${locale}/${base.slug}`;
  return `${prefix}${suffix}`;
}

export function createPlaceView<L extends string>(domain: string, place: Place<L>, locale: L, mode: LinkMode): PlaceView<L> {
  const base = { mode, slug: place.slug };
  return {
    place,
    locale,
    mode,
    href: (suffix, other = locale) => placeHref(base, other, suffix),
    url: (suffix, other = locale) => placeUrl(domain, place.slug, other, suffix),
  };
}
