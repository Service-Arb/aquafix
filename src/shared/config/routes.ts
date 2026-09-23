/**
 * The pages a location has, as locale- and location-free suffixes. The proxy,
 * the sitemap, the breadcrumbs and the route tree all read this one list, so a
 * page cannot exist in one and be forgotten by another.
 */
export const PAGES = {
  home: "",
  prices: "/prices",
  guarantee: "/guarantee",
  about: "/about",
} as const;

export type PageKey = keyof typeof PAGES;

export const PAGE_KEYS = Object.keys(PAGES) as PageKey[];

/** Not indexable, not in the sitemap, but negotiated like any other page. */
export const THANKS = "/thanks";

/** Every suffix the proxy treats as a page of a location. */
export const LOCATION_SUFFIXES: readonly string[] = [...Object.values(PAGES), THANKS];

/**
 * How links are written on a location's pages. On its own subdomain a page is
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
