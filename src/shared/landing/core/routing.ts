import type { BrandFacts, Site } from "./site";

/**
 * How links are written on a point's pages. On its own subdomain a page is
 * `/fr/prices`; reached through the apex fallback it is `/fr/<slug>/prices`.
 */
export type LinkMode = "host" | "path";

/**
 * The proxy says which mode a request is in through the path it rewrites to,
 * not a header: `royat.aquafix.top/fr/prices` renders `/fr/_royat/prices`.
 * A header would make every page read `headers()` and render per request; in
 * the path, each mode is its own cacheable page (ISR), and the two modes'
 * different links can never share a cache entry.
 */
export const HOST_MARK = "_";

/** The `[location]` param for a slug in a mode. */
export function locationParam(slug: string, mode: LinkMode): string {
  return mode === "host" ? `${HOST_MARK}${slug}` : slug;
}

/** Inverse of {@link locationParam}. */
export function parseLocationParam(param: string): { slug: string; mode: LinkMode } {
  return param.startsWith(HOST_MARK) ? { slug: param.slice(HOST_MARK.length), mode: "host" } : { slug: param, mode: "path" };
}

/** Not indexable, not in the sitemap, but negotiated like any other page. */
export const THANKS = "/thanks";

/** Every suffix the proxy treats as a page of a point. */
export function pointSuffixes<L extends string, P extends string, B extends BrandFacts>(site: Site<L, P, B>): string[] {
  return [...site.pageKeys.map(k => site.pages[k]), THANKS];
}
