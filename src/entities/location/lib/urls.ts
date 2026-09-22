import { BRAND } from "@/shared/config/brand";
import type { Locale } from "@/shared/config/i18n";
import type { LinkMode } from "@/shared/config/routes";

export const brandOrigin = (): string => `https://${BRAND.domain}`;

/** The canonical home of a point is its subdomain, whichever URL served it. */
export const locationOrigin = (slug: string): string => `https://${slug}.${BRAND.domain}`;

/** Absolute canonical URL of a point's page. */
export function locationUrl(slug: string, locale: Locale, suffix: string): string {
  return `${locationOrigin(slug)}/${locale}${suffix}`;
}

/** Where a point's pages link to, given how this request reached it. */
export interface LinkBase {
  mode: LinkMode;
  slug: string;
}

/**
 * A root-relative href to one of the point's pages. `suffix` is a page suffix
 * from `PAGES` and may carry a fragment: `"#quote"`, `"/prices#faq"`.
 */
export function locationHref(base: LinkBase, locale: Locale, suffix: string): string {
  const prefix = base.mode === "host" ? `/${locale}` : `/${locale}/${base.slug}`;
  return `${prefix}${suffix}`;
}
