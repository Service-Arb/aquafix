import type { BrandFacts, Site } from "./site";

/**
 * How links are written on a point's pages. On its own subdomain a page is
 * `/fr/prices`; reached through the apex fallback it is `/fr/<slug>/prices`.
 * The proxy decides which one a request is and says so in `site.headers.linkMode`.
 */
export type LinkMode = "host" | "path";

/** Not indexable, not in the sitemap, but negotiated like any other page. */
export const THANKS = "/thanks";

/** Every suffix the proxy treats as a page of a point. */
export function pointSuffixes<L extends string, P extends string, B extends BrandFacts>(site: Site<L, P, B>): string[] {
  return [...site.pageKeys.map(k => site.pages[k]), THANKS];
}
