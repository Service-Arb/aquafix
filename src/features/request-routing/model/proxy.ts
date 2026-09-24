import { NextResponse, type NextRequest } from "next/server";
import { GONE_HEADER, goneHeader, gonePath } from "@evinvest/kitstart";
import { LANG_COOKIE, LANG_COOKIE_MAX_AGE, type Routing } from "./decide";

/** The bare URL's answer depends on both; a shared cache must key on them. */
const VARY = "Accept-Language, Cookie";

function withoutGone(from: Headers): Headers {
  const headers = new Headers(from);
  headers.delete(GONE_HEADER);
  return headers;
}

/**
 * `decide`, applied to a live request. It passes nothing to a page but the
 * path it rewrites to: a page that read a request header would render per
 * request, and every page here is a cached one. The one header it sets goes
 * to the 404, which is not a page of any segment.
 */
export function createProxy<L extends string>(routing: Routing<L>): (request: NextRequest) => NextResponse {
  return function routeRequest(request) {
    const url = request.nextUrl;
    const decision = routing.decide({
      host: request.headers.get("host") ?? url.host,
      pathname: url.pathname,
      query: url.searchParams,
      acceptLanguage: request.headers.get("accept-language"),
      cookieLang: request.cookies.get(LANG_COOKIE)?.value ?? null,
    });

    // Only this proxy may say which point a 404 speaks for: a client-sent
    // value is dropped wherever the request goes on. Untouched when absent,
    // so an ordinary request forwards no header override at all.
    const own = request.headers.has(GONE_HEADER) ? { request: { headers: withoutGone(request.headers) } } : undefined;

    switch (decision.kind) {
      case "pass":
        return NextResponse.next(own);
      case "gone-target":
        // Header kept: it is this proxy's own, set one hop earlier. Reached by
        // hand with a forged one, the 404 can at most pick another real
        // point's phone or the other language.
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
          ? NextResponse.next(own)
          : NextResponse.rewrite(new URL(`${decision.pathname}${url.search}`, url), own);
      case "gone": {
        // To a path no route matches, which Next answers 404 from
        // `app/global-not-found.tsx` — the one reader of the header.
        const headers = withoutGone(request.headers);
        headers.set(GONE_HEADER, goneHeader(decision.locale, decision.location));
        return NextResponse.rewrite(new URL(gonePath(decision.locale), url), { request: { headers } });
      }
    }
  };
}
