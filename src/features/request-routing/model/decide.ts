import { LOCATION_SLUGS } from "@/entities/location";
import { BRAND } from "@/shared/config/brand";
import { i18n, isLocale, type Locale } from "@/shared/config/i18n";
import { LOCATION_SUFFIXES, type LinkMode } from "@/shared/config/routes";

/**
 * Which point and which language a request gets, decided before any route
 * renders. Pure, so it is tested without a server.
 *
 * ```text
 * <slug>.aquafix.top                → the point; /fr/prices renders /fr/<slug>/prices
 * aquafix.top/fr/<slug>/…           → the same point, through the apex (fallback)
 * ?lang=<l> on a page               → cookie for a year, 303 to the clean URL
 * unprefixed page, cookie or none   → 302 to /<cookie ?? Accept-Language>/…,
 *                                      Vary: Accept-Language, Cookie
 * ```
 *
 * The negotiation is a **302**, never a 301: the choice is per visitor and
 * must not be cached as permanent. A header-less crawler lands on French, the
 * default, and reaches English through `hreflang`. Only page paths enter —
 * `/quote`, `/sitemap.xml`, `/og`, assets pass straight through.
 */
export const LANG_COOKIE = "lang";
export const LANG_COOKIE_MAX_AGE = 31_536_000;

export interface RequestFacts {
  host: string;
  pathname: string;
  query: URLSearchParams;
  acceptLanguage: string | null;
  cookieLang: string | null;
}

export type Decision =
  | { kind: "pass" }
  | { kind: "negotiate"; location: string }
  | { kind: "choose"; location: string; locale: Locale }
  | { kind: "serve"; pathname: string; mode: LinkMode | null };

/** `royat.aquafix.top` → `"royat"`; `royat.localhost:3000` too, for local work. */
export function hostSlug(host: string): string | null {
  const name = host.toLowerCase().replace(/:\d+$/, "");
  for (const base of [BRAND.domain, "localhost"]) {
    if (name.endsWith(`.${base}`)) {
      const sub = name.slice(0, -(base.length + 1));
      return LOCATION_SLUGS.includes(sub) ? sub : null;
    }
  }
  return null;
}

/** Is `rest` (locale-free) a page this host serves? */
function isPage(rest: string, slug: string | null): boolean {
  if (slug) return LOCATION_SUFFIXES.includes(rest);
  if (rest === "") return true; // the brand page
  const [, first = "", ...more] = rest.split("/");
  const suffix = more.length ? `/${more.join("/")}` : "";
  return LOCATION_SLUGS.includes(first) && LOCATION_SUFFIXES.includes(suffix);
}

function split(pathname: string): { locale: Locale | null; rest: string } {
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const [, first = "", ...more] = trimmed.split("/");
  if (isLocale(first)) return { locale: first, rest: more.length ? `/${more.join("/")}` : "" };
  return { locale: null, rest: trimmed === "/" ? "" : trimmed };
}

function withQuery(path: string, query: URLSearchParams): string {
  const rest = new URLSearchParams(query);
  rest.delete("lang");
  const qs = rest.toString();
  return qs ? `${path}?${qs}` : path;
}

export function decide(req: RequestFacts): Decision {
  const slug = hostSlug(req.host);
  const { locale, rest } = split(req.pathname);
  const page = isPage(rest, slug);

  if (page) {
    const asked = req.query.get("lang");
    if (isLocale(asked)) {
      // The visitor chose, so record it and take the query back out — a shared
      // or bookmarked link should not keep re-asserting a language.
      return { kind: "choose", locale: asked, location: withQuery(i18n.localePath(asked, rest || "/"), req.query) };
    }
    if (locale === null) {
      const chosen = isLocale(req.cookieLang) ? req.cookieLang : i18n.negotiate(req.acceptLanguage);
      return { kind: "negotiate", location: withQuery(i18n.localePath(chosen, rest || "/"), req.query) };
    }
  }

  if (locale === null) return { kind: "pass" };
  // Every prefixed path on a point's host belongs to that point, page or not:
  // `/fr/nonsense` is that point's French 404, not the brand's.
  if (slug) return { kind: "serve", pathname: `/${locale}/${slug}${rest}`, mode: "host" };
  return { kind: "serve", pathname: req.pathname, mode: rest === "" ? null : "path" };
}
