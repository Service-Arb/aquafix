import type { Locale } from "@/shared/config/i18n";
import type { LinkMode } from "@/shared/config/routes";
import { locationHref, locationUrl } from "../lib/urls";
import type { Location } from "./types";

/**
 * A point as one request sees it: the merged record, the language, and how its
 * links are written on this host. Sections take this instead of eight props.
 */
export interface Point {
  location: Location;
  locale: Locale;
  mode: LinkMode;
  /** Root-relative link to one of this point's pages in `locale`. */
  href: (suffix: string, locale?: Locale) => string;
  /** Absolute canonical URL (always the subdomain). */
  url: (suffix: string, locale?: Locale) => string;
}

export function pointFor(location: Location, locale: Locale, mode: LinkMode): Point {
  const base = { mode, slug: location.slug };
  return {
    location,
    locale,
    mode,
    href: (suffix, other = locale) => locationHref(base, other, suffix),
    url: (suffix, other = locale) => locationUrl(location.slug, other, suffix),
  };
}
