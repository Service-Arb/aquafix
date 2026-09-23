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
 * The proxy decides which one a request is and says so in `LOCATION_MODE_HEADER`.
 */
export type LinkMode = "host" | "path";

export const LOCATION_MODE_HEADER = "x-aquafix-link-mode";

/**
 * The internal path a request was routed to (`/fr/royat/nonsense`), for the
 * one place that gets no params: `not-found.tsx`, which still has to answer in
 * the right language with the right point's phone.
 */
export const ROUTE_HEADER = "x-aquafix-route";
