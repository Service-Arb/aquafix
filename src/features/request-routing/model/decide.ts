import { GONE, locationParam, NON_PAGE_ROUTES, parseLocationParam, pointSuffixes, THANKS } from "@/shared/landing/core/routing";
import type { BrandFacts, Site } from "@/shared/landing/core/site";

/**
 * Which point and which language a request gets, decided before any route
 * renders. Pure, so it is tested without a server.
 *
 * ```text
 * <slug>.<domain>                   → the point; /fr/prices renders /fr/_<slug>/prices
 * <domain>/fr/<slug>/…              → the same point, through the apex (fallback)
 * a dead prefixed path              → the 404 for its point, or the brand's (see GONE)
 * ?lang=<l> on a page               → cookie for a year, 303 to the clean URL
 * a `legacyRedirects` path          → 301 to where it moved
 * unprefixed page, cookie or none   → 302 to /<cookie ?? Accept-Language>/…,
 *                                      Vary: Accept-Language, Cookie
 * ```
 *
 * The negotiation is a **302**, never a 301: the choice is per visitor and
 * must not be cached as permanent. A header-less crawler lands on the default
 * locale, and reaches the others through `hreflang`. Only page paths enter —
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

export type Decision<L extends string> =
  | { kind: "pass" }
  | { kind: "negotiate"; location: string }
  | { kind: "choose"; location: string; locale: L }
  | { kind: "moved"; location: string }
  | { kind: "serve"; pathname: string }
  /**
   * The 404's own target (`/<locale>/404/404`), coming back in: Next serves a
   * rewrite to a path no route matches by proxying it to itself, through this
   * proxy again. It passes with its header, or the point is lost — or, sent
   * to the 404 once more, it loops.
   */
  | { kind: "gone-target" }
  /** A dead prefixed path: the 404 in `locale`, for a point's param or the brand (see `GONE`). */
  | { kind: "gone"; locale: L; location: string | null };

export interface Routing<L extends string> {
  /** `royat.<domain>` → `"royat"`; `royat.localhost:3000` too, for local work. */
  hostSlug(host: string): string | null;
  decide(req: RequestFacts): Decision<L>;
}

function withQuery(path: string, query: URLSearchParams): string {
  const rest = new URLSearchParams(query);
  rest.delete("lang");
  const qs = rest.toString();
  return qs ? `${path}?${qs}` : path;
}

export function createRouting<L extends string, P extends string, B extends BrandFacts>(
  site: Site<L, P, B>,
): Routing<L> {
  const { i18n, placeSlugs } = site;
  const suffixes = pointSuffixes(site);
  const hosts = [site.brand.domain, "localhost"].filter((h): h is string => h !== null);

  function hostSlug(host: string): string | null {
    const name = host.toLowerCase().replace(/:\d+$/, "");
    for (const base of hosts) {
      if (name.endsWith(`.${base}`)) {
        const sub = name.slice(0, -(base.length + 1));
        return placeSlugs.includes(sub) ? sub : null;
      }
    }
    return null;
  }

  function legacy(locale: L | null, rest: string): string | null {
    for (const redirect of site.legacyRedirects ?? []) {
      if (redirect.from !== rest) continue;
      const to = redirect.to(locale);
      if (to !== null) return to;
    }
    return null;
  }

  /** Is `rest` (locale-free) a page this host serves? */
  function isPage(rest: string, slug: string | null): boolean {
    if (slug) return suffixes.includes(rest);
    if (rest === "" || rest === THANKS) return true; // the brand's own pages
    const [, first = "", ...more] = rest.split("/");
    const suffix = more.length ? `/${more.join("/")}` : "";
    return placeSlugs.includes(first) && suffixes.includes(suffix);
  }

  function split(pathname: string): { locale: L | null; rest: string } {
    const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
    const [, first = "", ...more] = trimmed.split("/");
    if (i18n.isLocale(first)) return { locale: first, rest: more.length ? `/${more.join("/")}` : "" };
    return { locale: null, rest: trimmed === "/" ? "" : trimmed };
  }

  function decide(req: RequestFacts): Decision<L> {
    const slug = hostSlug(req.host);
    const { locale, rest } = split(req.pathname);
    if (!slug) {
      const moved = legacy(locale, rest);
      if (moved) return { kind: "moved", location: withQuery(moved, req.query) };
    }
    const page = isPage(rest, slug);

    if (page) {
      const asked = req.query.get("lang");
      if (i18n.isLocale(asked)) {
        // The visitor chose, so record it and take the query back out — a shared
        // or bookmarked link should not keep re-asserting a language.
        return { kind: "choose", locale: asked, location: withQuery(i18n.localePath(asked, rest || "/"), req.query) };
      }
      if (locale === null) {
        return { kind: "negotiate", location: withQuery(i18n.localePath(chosenLocale(req), rest || "/"), req.query) };
      }
    }

    if (locale === null) {
      // Only the routes that are not pages pass. Anything else unprefixed —
      // `/nope`, a scanner's `/wp-login.php` — would land in `[locale]` and
      // throw a `notFound()` Next caches as a page: one ISR entry per junk
      // path, crowding the real pages and the live data out of the in-memory
      // cache. It is a 404 in the visitor's language instead, never cached.
      if (NON_PAGE_ROUTES.includes(rest) || rest.startsWith("/_next/")) return { kind: "pass" };
      return dead(chosenLocale(req), rest, slug);
    }
    // Before the host is read: the target comes back on whichever host the
    // dead path was asked on.
    if (rest === `/${GONE}/${GONE}`) return { kind: "gone-target" };
    // Every prefixed path on a point's host belongs to that point, page or not:
    // `/fr/nonsense` is that point's French 404, not the brand's.
    if (slug) {
      return page ? { kind: "serve", pathname: `/${locale}/${locationParam(slug, "host")}${rest}` } : dead(locale, rest, slug);
    }
    if (page) return { kind: "serve", pathname: req.pathname };
    // A host-mode page (`/fr/_royat/prices`) passes as it is. It must: Next runs
    // this proxy again, host-less, on the rewritten path when it renders a page
    // into its cache. Reached from the apex by hand it is the same cached page,
    // whose canonical is the subdomain — no second copy for an index to find.
    const [, first = "", ...more] = rest.split("/");
    const named = parseLocationParam(first);
    const suffix = more.length ? `/${more.join("/")}` : "";
    if (named.mode === "host" && placeSlugs.includes(named.slug) && suffixes.includes(suffix)) {
      return { kind: "serve", pathname: req.pathname };
    }
    return dead(locale, rest, null);
  }

  /** The visitor's language when the path does not name one. */
  function chosenLocale(req: RequestFacts): L {
    return i18n.isLocale(req.cookieLang) ? req.cookieLang : i18n.negotiate(req.acceptLanguage);
  }

  /**
   * The 404 for a dead path (`rest`, locale-free): the point's whose host it
   * came through, or whose slug it starts with, else the brand's.
   */
  function dead(locale: L, rest: string, slug: string | null): Decision<L> {
    if (slug) return { kind: "gone", locale, location: locationParam(slug, "host") };
    const [, first = ""] = rest.split("/");
    return { kind: "gone", locale, location: placeSlugs.includes(parseLocationParam(first).slug) ? first : null };
  }

  return { hostSlug, decide };
}
