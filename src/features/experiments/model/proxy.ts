import { forcedVariant } from "@evinvest/experiments";
import { abProxy } from "@evinvest/experiments/next";
import { createRouting, GONE_HEADER, LANG_COOKIE, parsePlaceParam } from "@evinvest/kitstart";
import { createProxy } from "@evinvest/kitstart/proxy";
import { NextResponse, type NextRequest } from "next/server";
import { EXPERIMENT_IDS, EXPERIMENTS, FORCE_PARAM, FORCED_COOKIE } from "@/shared/config/experiments";
import { site } from "@/shared/config/site";
import { assignmentOf, BUCKET_SEGMENT, decodeBucket, encodeBucket, isBot } from "@/shared/lib/experiments";

/**
 * kitstart's routing with the A/B assignment on top.
 *
 * The pages stay cached (ISR) because the variant rides in the path, the same
 * way kitstart carries the link mode: a point's home is rewritten to
 * `/fr/_royat/ab/ba`, one cache entry per combination, and no page reads a
 * cookie. The all-control combination keeps the plain path, so bots and the
 * control arm share the entry that existed before any test.
 *
 * Next runs the proxy a second time, on the path it rewrote to, for every
 * request — a cache hit included (measured on 16.3: host `localhost`, the
 * visitor's cookies). Assigning again there would draw a second variant, so
 * only the visitor's own URL is assigned: a bucket path passes as it is, and
 * so does a host-mode path (`/fr/_royat…`), which no visitor types.
 */
const kit = createProxy(site);
const routing = createRouting(site);

/** `/fr/_royat/ab/ba` — the second pass over a rewrite this proxy made. */
const BUCKET_PATH = new RegExp(`^/([^/]+)/([^/]+)/${BUCKET_SEGMENT}/([^/]+)/?$`);

function onward(request: NextRequest, rewrite: URL | null): NextResponse {
  // The not-found header is only ever kitstart's to send, and never to a page.
  const headers = new Headers(request.headers);
  headers.delete(GONE_HEADER);
  return rewrite ? NextResponse.rewrite(rewrite, { request: { headers } }) : NextResponse.next({ request: { headers } });
}

function isOurBucket(pathname: string): boolean {
  const [, locale, param = "", bucket = ""] = BUCKET_PATH.exec(pathname) ?? [];
  return site.i18n.isLocale(locale) && site.placeSlugs.includes(parsePlaceParam(param).slug) && decodeBucket(bucket) !== null;
}

function wasForced(request: NextRequest): boolean {
  return EXPERIMENT_IDS.some(id => forcedVariant(EXPERIMENTS, id, request.nextUrl.searchParams.get(`${FORCE_PARAM}${id}`)) !== undefined);
}

export function experimentProxy(request: NextRequest): NextResponse {
  const url = request.nextUrl;
  if (isOurBucket(url.pathname)) return onward(request, null);

  const decision = routing.decide({
    host: request.headers.get("host") ?? url.host,
    pathname: url.pathname,
    query: url.searchParams,
    acceptLanguage: request.headers.get("accept-language"),
    cookieLang: request.cookies.get(LANG_COOKIE)?.value ?? null,
  });
  if (decision.kind !== "serve") return kit(request);
  const [, , param = "", ...rest] = decision.pathname.replace(/\/+$/, "").split("/");
  const place = parsePlaceParam(param);
  const secondPass = place.mode === "host" && decision.pathname === url.pathname;
  if (!site.placeSlugs.includes(place.slug) || secondPass || isBot(request.headers.get("user-agent"))) return kit(request);

  const assigned = abProxy(EXPERIMENTS, request, { forceParam: FORCE_PARAM });
  const bucket = rest.length === 0 ? encodeBucket(assignmentOf(name => request.cookies.get(name)?.value)) : null;
  const response = bucket
    ? onward(request, new URL(`${decision.pathname.replace(/\/+$/, "")}/${BUCKET_SEGMENT}/${bucket}${url.search}`, url))
    : kit(request);
  for (const cookie of assigned.headers.getSetCookie()) response.headers.append("set-cookie", cookie);
  // A session cookie: QA's browser stays marked until it is closed. Appended
  // raw, like the ones above: `response.cookies.set` would rewrite the header
  // from its own map and drop them.
  if (wasForced(request)) response.headers.append("set-cookie", `${FORCED_COOKIE}=1; Path=/; SameSite=Lax`);
  return response;
}
