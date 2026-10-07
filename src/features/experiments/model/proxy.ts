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
 * QA's state lives in the URL: a visit with a force shows what its query
 * forces, and a point's home reached from outside without one is an ordinary
 * visit again ({@link leavesQa}). So the forced variants never outlive the QA
 * session that asked for them — before, they stuck for 30 days, and one test
 * forced after another kept both.
 *
 * A test the query does not name takes, coming from inside the site, its
 * current cookie: after the logo or the language switch the URL has lost the
 * earlier forces, and the menu's tap adds only its own key, so going by the
 * snapshot would undo the others unasked. Coming from outside, the URL is the
 * whole state, and an unnamed test is the visitor's own (the snapshot).
 *
 * The visitor's own variants are kept in the mark itself ({@link QA_COOKIE},
 * `encodeQaSnapshot`): saved on the first forced visit — from the cookies,
 * after `abProxy` drew a newcomer's — and never overwritten by a later one,
 * whose cookies already hold forced variants. A mark of `1` (set before the
 * snapshot) is no snapshot: a force takes the cookies as they stand, the best
 * left to know. A test missing from a snapshot (paused when it was saved, or
 * its pair unknown to this code) takes its cookie the same way.
 *
 * `read` must already see `abProxy`'s draw, and leaving QA's redraw of what the
 * snapshot cannot give back ({@link redrawn}).
 */
function qaStep(
  config: LiveExperiments,
  forced: QaSnapshot,
  saved: QaSnapshot | null,
  move: { readonly inSite: boolean; readonly leaves: boolean },
  read: (name: string) => string | undefined,
): QaStep {
  const running = (id: ExperimentId) => config[id].enabled !== false;
  if (EXPERIMENT_IDS.some(id => forced[id] !== undefined)) {
    const current = assignedVariants(config, read);
    const snapshot: QaSnapshot = { ...current, ...saved };
    const variants: QaSnapshot = {};
    for (const id of EXPERIMENT_IDS.filter(running)) {
      const variant = forced[id] ?? (move.inSite ? current[id] : snapshot[id]);
      if (variant !== undefined) variants[id] = variant;
    }
    return { variants, mark: { set: encodeQaSnapshot(snapshot) } };
  }
  if (move.leaves) {
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

/**
 * Whether a navigation comes from inside the site: `Sec-Fetch-Site`
 * `same-origin` — the language switch, the logo, the thanks page's way home,
 * Next's RSC fetches and prefetches — or `same-site`, the apex and the points'
 * subdomains passing a visitor along. `none` (typed, a bookmark),
 * `cross-site` (a link from another site) and no header at all (a browser too
 * old to send it) are from outside.
 */
function fromInsideSite(request: NextRequest): boolean {
  const from = request.headers.get("sec-fetch-site");
  return from === "same-origin" || from === "same-site";
}

/**
 * Whether a visit to a point's home without a force ends QA (the owner's rule):
 * one from outside the site ({@link fromInsideSite}), or the menu's **Reset**.
 * A move inside the site keeps QA.
 *
 * Reset is same-origin too: kitstart's `abReset("reassign")` deletes every
 * `ab_<key>` and reloads the home without the query. A QA browser has no other
 * way to lose them all — the proxy assigns every running test on each visit —
 * so no running test's cookie, with the mark alive, is that tap. Read before
 * `abProxy`, which would draw them again.
 */
function leavesQa(config: LiveExperiments, inSite: boolean, read: (name: string) => string | undefined): boolean {
  return !inSite || EXPERIMENT_IDS.every(id => config[id].enabled === false || read(cookieName(id)) === undefined);
}

/**
 * The running tests whose cookie goes before `abProxy`, so it draws them
 * afresh: what QA may have forced and nothing can give back. Leaving QA, every
 * test the snapshot lacks — all of them under a mark of `1` from before the
 * snapshot, which otherwise left forced variants counted as `forced: false`.
 * And every one under the legacy `ab_forced` mark, which never had a
 * snapshot, unless a real one came after it.
 */
function redrawn(config: LiveExperiments, saved: QaSnapshot | null, leaves: boolean, legacy: boolean): ExperimentId[] {
  const running = EXPERIMENT_IDS.filter(id => config[id].enabled !== false);
  if (leaves) return running.filter(id => saved?.[id] === undefined);
  return legacy && saved === null ? running : [];
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
  const saved = decodeQaSnapshot(mark);
  const legacy = read(LEGACY_QA_COOKIE) !== undefined;
  const forced = forcedBy(config, url.searchParams);
  const inSite = fromInsideSite(request);
  // An empty mark is no mark (`isForced`, kitstart's gate): a visitor carrying
  // one must keep their arms, not be drawn again as if leaving QA.
  const leaves = !!mark && rest.length === 0 && !EXPERIMENT_IDS.some(id => forced[id] !== undefined) && leavesQa(config, inSite, read);
  for (const id of redrawn(config, saved, leaves, legacy)) request.cookies.delete(cookieName(id));
  // No `forceParam`: abProxy only draws a newcomer's own variants, which QA's
  // snapshot then saves; the force is `qaStep`'s.
  const assigned = abProxy(config, request);
  const qa = qaStep(config, forced, saved, { inSite, leaves }, read);
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
  // The legacy mark is no longer moved: it carries no snapshot, so the
  // variants it marked were drawn afresh above. A forced visit has just set
  // the new mark.
  if (legacy) response.headers.append("set-cookie", `${LEGACY_QA_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`);
  return response;
}
