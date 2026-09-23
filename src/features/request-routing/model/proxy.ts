import { NextResponse, type NextRequest } from "next/server";
import type { BrandFacts, Site } from "@/shared/landing/core/site";
import { LANG_COOKIE, LANG_COOKIE_MAX_AGE, type Routing } from "./decide";

/** The bare URL's answer depends on both; a shared cache must key on them. */
const VARY = "Accept-Language, Cookie";

/** `decide`, applied to a live request. */
export function createProxy<L extends string, P extends string, B extends BrandFacts>(
  site: Site<L, P, B>,
  routing: Routing<L>,
): (request: NextRequest) => NextResponse {
  const { linkMode, route } = site.headers;

  /**
   * The request's headers without the two only this proxy may set. Stripped on
   * every branch — a client-sent value must never choose how links render or
   * which point a 404 speaks for, including on a path the proxy passes through.
   */
  function ownHeaders(request: NextRequest): Headers {
    const headers = new Headers(request.headers);
    headers.delete(linkMode);
    headers.delete(route);
    return headers;
  }

  return function routeRequest(request) {
    const url = request.nextUrl;
    const decision = routing.decide({
      host: request.headers.get("host") ?? url.host,
      pathname: url.pathname,
      query: url.searchParams,
      acceptLanguage: request.headers.get("accept-language"),
      cookieLang: request.cookies.get(LANG_COOKIE)?.value ?? null,
    });
    const headers = ownHeaders(request);

    switch (decision.kind) {
      case "pass":
        return NextResponse.next({ request: { headers } });
      case "moved":
        return NextResponse.redirect(new URL(decision.location, url), 301);
      case "negotiate": {
        const response = NextResponse.redirect(new URL(decision.location, url), 302);
        response.headers.set("Vary", VARY);
        return response;
      }
      case "choose": {
        const response = NextResponse.redirect(new URL(decision.location, url), 303);
        response.cookies.set(LANG_COOKIE, decision.locale, {
          path: "/",
          maxAge: LANG_COOKIE_MAX_AGE,
          sameSite: "lax",
          httpOnly: true,
          secure: true,
        });
        return response;
      }
      case "serve": {
        if (decision.mode) headers.set(linkMode, decision.mode);
        headers.set(route, decision.pathname);
        // No `Vary` here, unlike the Rust server: there the bare URL *was* a page
        // whose language depended on the request. Here every page's language is
        // in its path, so a prefixed page is the same bytes for every visitor;
        // only the bare URL's redirect varies, and that response says so. (Next
        // also overwrites `Vary` on rendered pages, so it could not be set anyway.)
        return decision.pathname === url.pathname
          ? NextResponse.next({ request: { headers } })
          : NextResponse.rewrite(new URL(`${decision.pathname}${url.search}`, url), { request: { headers } });
      }
    }
  };
}
