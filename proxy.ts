import { GONE } from "@evinvest/kitstart";
import { createProxy } from "@evinvest/kitstart/proxy";
import { NextRequest, type NextResponse } from "next/server";
import { site } from "@/shared/config/site";

const landing = createProxy(site);

/** A path naming a file; this app serves none outside `/_next/` (no `public/`). */
const FILE = /\.[a-z0-9]+$/i;

/** The routes in `app/` whose path has an extension: Next's metadata routes. */
export const FILE_ROUTES: readonly string[] = ["/sitemap.xml", "/robots.txt"];

/**
 * kitstart's proxy, plus the one thing it leaves to the matcher: paths with an
 * extension. kitstart passes them, for a brand that serves files; this one
 * serves none, and a scanner's `/wp-login.php` let through reaches `[locale]`,
 * where Next caches a bare 404 page per probe — without the brand's screen or
 * the phone. Asked with one more segment no page has, `decide` answers it as
 * any dead path: `gone`, in the path's or the visitor's language, for its point.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  if (!FILE.test(pathname) || FILE_ROUTES.includes(pathname)) return landing(request);
  const dead = request.nextUrl.clone();
  dead.pathname = `${pathname}/${GONE}`;
  return landing(new NextRequest(dead, request));
}

export const config = {
  // Everything but the build output. Files with an extension enter too (see
  // above), unlike kitstart's `PROXY_MATCHER`; `/quote`, `/og`, `/health`,
  // `/sitemap.xml` and `/robots.txt` are passed by `decide`.
  matcher: ["/((?!_next/).*)"],
};
