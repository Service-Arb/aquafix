import { forcedVariant } from "@evinvest/experiments";
import { abProxy } from "@evinvest/experiments/next";
import { createRouting, GONE_HEADER, LANG_COOKIE, parsePlaceParam } from "@evinvest/kitstart";
import { createProxy } from "@evinvest/kitstart/proxy";
import { NextResponse, type NextRequest } from "next/server";
import { EXPERIMENT_IDS, FORCE_PARAM, FORCED_COOKIE, type LiveExperiments } from "@/shared/config/experiments";
import { site } from "@/shared/config/site";
import { assignmentOf, BUCKET_SEGMENT, decodeBucket, disabledCookies, encodeBucket, isBot } from "@/shared/lib/experiments";
import { liveExperiments, type LiveConfig } from "../api/live";

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
 *
 * Every decision goes by the config with the panel's overrides applied, read
 * once per request: an experiment switched off there gets its control letter
 * in the bucket — so no cached `b` page is reached — and its cookie is
 * dropped, so the browser's beacon (which has only the code's config) and the
 * form's POST stop counting the visitor in an arm.
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

function isOurBucket(config: LiveExperiments, pathname: string): boolean {
  const [, locale, param = "", bucket = ""] = BUCKET_PATH.exec(pathname) ?? [];
  return site.i18n.isLocale(locale) && site.placeSlugs.includes(parsePlaceParam(param).slug) && decodeBucket(config, bucket) !== null;
}

function wasForced(config: LiveExperiments, request: NextRequest): boolean {
  return EXPERIMENT_IDS.some(id => forcedVariant(config, id, request.nextUrl.searchParams.get(`${FORCE_PARAM}${id}`)) !== undefined);
}

/** The proxy over a source of the applied config; `experimentProxy` reads the panel's. */
export function createExperimentProxy(live: LiveConfig): (request: NextRequest) => Promise<NextResponse> {
  return async request => assign(await live(), request);
}

export const experimentProxy = createExperimentProxy(liveExperiments);

function assign(config: LiveExperiments, request: NextRequest): NextResponse {
  const url = request.nextUrl;
  if (isOurBucket(config, url.pathname)) return onward(request, null);

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

  const read = (name: string) => request.cookies.get(name)?.value;
  const dropped = disabledCookies(config, read);
  const assigned = abProxy(config, request, { forceParam: FORCE_PARAM });
  const bucket = rest.length === 0 ? encodeBucket(assignmentOf(config, read)) : null;
  const response = bucket
    ? onward(request, new URL(`${decision.pathname.replace(/\/+$/, "")}/${BUCKET_SEGMENT}/${bucket}${url.search}`, url))
    : kit(request);
  for (const cookie of assigned.headers.getSetCookie()) response.headers.append("set-cookie", cookie);
  // Dropped rather than kept for a test that may come back: an operator's
  // switch is "stop counting this", and a visitor re-entering is drawn anew.
  for (const name of dropped) response.headers.append("set-cookie", `${name}=; Path=/; Max-Age=0; SameSite=Lax`);
  // A session cookie: QA's browser stays marked until it is closed. Appended
  // raw, like the ones above: `response.cookies.set` would rewrite the header
  // from its own map and drop them.
  if (wasForced(config, request)) response.headers.append("set-cookie", `${FORCED_COOKIE}=1; Path=/; SameSite=Lax`);
  return response;
}
