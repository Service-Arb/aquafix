import { NextResponse, type NextRequest } from "next/server";
import { decide, LANG_COOKIE, LANG_COOKIE_MAX_AGE } from "./decide";

/** The bare URL's answer depends on both; a shared cache must key on them. */
const VARY = "Accept-Language, Cookie";

/**
 * `decide`, applied to a live request. It passes nothing to the page but the
 * path it rewrites to: a page that read a request header would render per
 * request, and every page here is a cached one.
 */
export function routeRequest(request: NextRequest): NextResponse {
  const url = request.nextUrl;
  const decision = decide({
    host: request.headers.get("host") ?? url.host,
    pathname: url.pathname,
    query: url.searchParams,
    acceptLanguage: request.headers.get("accept-language"),
    cookieLang: request.cookies.get(LANG_COOKIE)?.value ?? null,
  });

  switch (decision.kind) {
    case "pass":
      return NextResponse.next();
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
    case "serve":
      // No `Vary` here, unlike the Rust server: there the bare URL *was* a page
      // whose language depended on the request. Here every page's language is
      // in its path, so a prefixed page is the same bytes for every visitor;
      // only the bare URL's redirect varies, and that response says so. (Next
      // also overwrites `Vary` on rendered pages, so it could not be set anyway.)
      return decision.pathname === url.pathname
        ? NextResponse.next()
        : NextResponse.rewrite(new URL(`${decision.pathname}${url.search}`, url));
  }
}
