import { cookieName, forcedVariant } from "@evinvest/experiments";
import { abProxy } from "@evinvest/experiments/next";
import { createRouting, GONE_HEADER, LANG_COOKIE, parsePlaceParam } from "@evinvest/kitstart";
import { createProxy } from "@evinvest/kitstart/proxy";
import { NextResponse, type NextRequest } from "next/server";
import {
  EXPERIMENT_IDS,
  FORCE_PARAM,
  FORCED_MAX_AGE,
  LEGACY_QA_COOKIE,
  QA_COOKIE,
  type ExperimentId,
  type LiveExperiments,
} from "@/shared/config/experiments";
import { site } from "@/shared/config/site";
import {
  assignedVariants,
  assignmentOf,
  BUCKET_SEGMENT,
  decodeBucket,
  decodeQaSnapshot,
  disabledCookies,
  encodeBucket,
  encodeQaSnapshot,
  isBot,
  type QaSnapshot,
} from "@/shared/lib/experiments";
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

/** The variants this request's query forces: valid ones of running tests only, as abProxy's force would take. */
function forcedBy(config: LiveExperiments, query: URLSearchParams): QaSnapshot {
  const out: QaSnapshot = {};
  for (const id of EXPERIMENT_IDS) {
    const variant = forcedVariant(config, id, query.get(`${FORCE_PARAM}${id}`));
    if (variant !== undefined) out[id] = variant;
  }
  return out;
}

/** What QA changes on a request: the variants to write, and the mark — set to a snapshot, dropped, or left as it is. */
type QaStep = { readonly variants: QaSnapshot; readonly mark: { readonly set: string } | "drop" | "keep" };

/**
 * QA's state lives in the URL: a visit with a force shows exactly what its
 * query forces, every other test at the visitor's own variant, and a point's
 * home without one is an ordinary visit again. So the forced variants never
 * outlive the URL that asked for them — before, they stuck for 30 days, and
 * one test forced after another kept both.
 *
 * The visitor's own variants are kept in the mark itself ({@link QA_COOKIE},
 * `encodeQaSnapshot`): saved on the first forced visit — from the cookies,
 * after `abProxy` drew a newcomer's — and never overwritten by a later one,
 * whose cookies already hold forced variants. A mark of `1` (set before the
 * snapshot) or of anything else is no snapshot: the cookies are taken as they
 * stand, the best left to know. A test missing from a snapshot (paused when it
 * was saved) takes its cookie the same way.
 *
 * `read` must already see `abProxy`'s draw. Only the home exits: QA's menu
 * lives there, and a page further in is reached without the query.
 */
function qaStep(config: LiveExperiments, forced: QaSnapshot, mark: string | undefined, home: boolean, read: (name: string) => string | undefined): QaStep {
  const saved = decodeQaSnapshot(mark);
  const running = (id: ExperimentId) => config[id].enabled !== false;
  if (EXPERIMENT_IDS.some(id => forced[id] !== undefined)) {
    const snapshot: QaSnapshot = { ...assignedVariants(config, read), ...saved };
    const variants: QaSnapshot = {};
    for (const id of EXPERIMENT_IDS.filter(running)) {
      const variant = forced[id] ?? snapshot[id];
      if (variant !== undefined) variants[id] = variant;
    }
    return { variants, mark: { set: encodeQaSnapshot(snapshot) } };
  }
  if (home && mark !== undefined) {
    // A paused test's cookie is being dropped (`disabledCookies`); writing its
    // saved variant back would undo that.
    const variants: QaSnapshot = {};
    for (const id of EXPERIMENT_IDS.filter(running)) {
      const variant = saved?.[id];
      if (variant !== undefined) variants[id] = variant;
    }
    return { variants, mark: "drop" };
  }
  return { variants: {}, mark: "keep" };
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
  const mark = read(QA_COOKIE);
  const legacy = read(LEGACY_QA_COOKIE) !== undefined;
  // No `forceParam`: abProxy only draws a newcomer's own variants, which QA's
  // snapshot then saves; the force is `qaStep`'s.
  const assigned = abProxy(config, request);
  const qa = qaStep(config, forcedBy(config, url.searchParams), mark, rest.length === 0, read);
  // Into the request too, so this render's bucket shows them; the cookie, so
  // the beacon and the lead's POST, which read `ab_<key>`, count what was drawn.
  const written = new Map<string, string>();
  for (const id of EXPERIMENT_IDS) {
    const variant = qa.variants[id];
    const name = cookieName(id);
    if (variant === undefined || read(name) === variant) continue;
    request.cookies.set(name, variant);
    written.set(name, variant);
  }
  const bucket = rest.length === 0 ? encodeBucket(assignmentOf(config, read)) : null;
  const response = bucket
    ? onward(request, new URL(`${decision.pathname.replace(/\/+$/, "")}/${BUCKET_SEGMENT}/${bucket}${url.search}`, url))
    : kit(request);
  // One header per cookie: a newcomer's draw that QA overrode in the same
  // request is left out, rather than relying on the browser applying the last.
  for (const cookie of assigned.headers.getSetCookie()) {
    if (!written.has(cookie.slice(0, cookie.indexOf("=")))) response.headers.append("set-cookie", cookie);
  }
  // Appended raw, like the rest: `response.cookies.set` would rewrite the
  // header from its own map and drop them. As long-lived as abProxy's own
  // (`FORCED_MAX_AGE`), and the mark as long as the variants it gives back.
  for (const [name, value] of written) response.headers.append("set-cookie", `${name}=${value}; Path=/; Max-Age=${FORCED_MAX_AGE}; SameSite=Lax`);
  // Dropped rather than kept for a test that may come back: an operator's
  // switch is "stop counting this", and a visitor re-entering is drawn anew.
  for (const name of dropped) response.headers.append("set-cookie", `${name}=; Path=/; Max-Age=0; SameSite=Lax`);
  if (qa.mark === "drop") response.headers.append("set-cookie", `${QA_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`);
  else if (qa.mark !== "keep") response.headers.append("set-cookie", `${QA_COOKIE}=${qa.mark.set}; Path=/; Max-Age=${FORCED_MAX_AGE}; SameSite=Lax`);
  // The legacy mark is no longer moved: it carries no snapshot, and a visit
  // without a force now leaves QA anyway. A forced one has just set the new.
  if (legacy) response.headers.append("set-cookie", `${LEGACY_QA_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`);
  return response;
}
