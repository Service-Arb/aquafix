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

/**
 * How a dead path reaches a 404 a visitor without JavaScript can read.
 *
 * Next 16 cannot put a `notFound()` boundary into the HTML: that response is
 * an empty `<html id="__next_error__">` the client fills in after hydration.
 * What it does render on the server is a path no route matches — through
 * `app/global-not-found.tsx`. The proxy knows every point and every page, so
 * it rewrites a dead path to `/<locale>/404/404`, which matches nothing, and
 * says which language and point the 404 speaks for in {@link GONE_HEADER}.
 * Reserved: no point may take `404` as its slug.
 */
export const GONE = "404";

/** The path no route matches, in a language. */
export function gonePath(locale: string): string {
  return `/${locale}/${GONE}/${GONE}`;
}

/**
 * Read only by the global not-found page, a route of its own: a page that
 * read it would render per request, and none does.
 */
export const GONE_HEADER = "x-landing-not-found";

/** `fr` or `fr/_royat`: the 404's language and, if it has one, its point. */
export function goneHeader(locale: string, location: string | null): string {
  return location ? `${locale}/${location}` : locale;
}

/** Inverse of {@link goneHeader}; anything absent or malformed reads as nothing. */
export function parseGoneHeader(value: string | null): { locale?: string; location?: string } {
  const [locale, location] = (value ?? "").split("/");
  return { ...(locale ? { locale } : {}), ...(location ? { location } : {}) };
}

/** Every suffix the proxy treats as a page of a point. */
export function pointSuffixes<L extends string, P extends string, B extends BrandFacts>(site: Site<L, P, B>): string[] {
  return [...site.pageKeys.map(k => site.pages[k]), THANKS];
}
