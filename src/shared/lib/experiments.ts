import { cookieName, resolveVariant, type ExperimentSpec } from "@evinvest/experiments";
import { CONTROL, EXPERIMENT_IDS, EXPERIMENTS, FORCED_COOKIE, type Assignment, type ExperimentId } from "@/shared/config/experiments";

/**
 * Crawlers, link unfurlers and ad reviewers. They always get the control and
 * no cookie: a search engine must see the page a visitor without a cookie
 * sees, or the test reads as cloaking.
 */
const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|mediapartners|adsbot|google-inspectiontool/i;

export function isBot(userAgent: string | null): boolean {
  return userAgent === null || userAgent.trim() === "" || BOT_UA.test(userAgent);
}

/** A `Cookie` header (or `document.cookie`) as a lookup. Malformed pairs are skipped. */
export function cookieReader(header: string | null): (name: string) => string | undefined {
  const jar = new Map<string, string>();
  for (const pair of (header ?? "").split(";")) {
    const at = pair.indexOf("=");
    if (at <= 0) continue;
    const name = pair.slice(0, at).trim();
    try {
      jar.set(name, decodeURIComponent(pair.slice(at + 1).trim()));
    } catch {
      // A value that is not valid percent-encoding is not one of ours.
    }
  }
  return name => jar.get(name);
}

/** The enabled experiments this browser carries a cookie for, with their variants. */
export function assignedVariants(read: (name: string) => string | undefined): Partial<Record<ExperimentId, string>> {
  const out: Partial<Record<ExperimentId, string>> = {};
  for (const id of EXPERIMENT_IDS) {
    // Widened: the config's `as const` makes today's `true` a literal.
    const spec: ExperimentSpec = EXPERIMENTS[id];
    if (spec.enabled === false) continue;
    const raw = read(cookieName(id));
    if (raw === undefined) continue;
    out[id] = resolveVariant(EXPERIMENTS, id, raw);
  }
  return out;
}

/** The page a request should see: its cookies' variants, control where it has none. */
export function assignmentOf(read: (name: string) => string | undefined): Assignment {
  return {
    hero_call_first: resolveVariant(EXPERIMENTS, "hero_call_first", read(cookieName("hero_call_first"))),
    quote_price_anchor: resolveVariant(EXPERIMENTS, "quote_price_anchor", read(cookieName("quote_price_anchor"))),
    lead_layout: resolveVariant(EXPERIMENTS, "lead_layout", read(cookieName("lead_layout"))),
  };
}

export function isForced(read: (name: string) => string | undefined): boolean {
  return read(FORCED_COOKIE) === "1";
}

/**
 * The static segment before an assignment in a rewritten path:
 * `/fr/_royat/ab/ba`. Static, so `/fr/404/404` — kitstart's path no route may
 * match — still matches none.
 */
export const BUCKET_SEGMENT = "ab";

/**
 * The assignment spelled as a path segment, one letter per experiment in
 * config order — or `null` for the all-control page, which keeps its own URL
 * so bots, the apex and a disabled test share the one cache entry they had.
 */
export function encodeBucket(assignment: Assignment): string | null {
  const letters = EXPERIMENT_IDS.map(id => assignment[id]).join("");
  const control = EXPERIMENT_IDS.map(id => CONTROL[id]).join("");
  return letters === control ? null : letters;
}

/** Inverse of {@link encodeBucket}; anything that is not a real, non-control assignment is `null`. */
export function decodeBucket(letters: string): Assignment | null {
  if (letters.length !== EXPERIMENT_IDS.length) return null;
  const assignment = assignmentOf(name => {
    const index = EXPERIMENT_IDS.findIndex(id => cookieName(id) === name);
    return index < 0 ? undefined : letters[index];
  });
  // `resolveVariant` turned anything invalid (or a disabled test) into control;
  // a segment that does not re-encode to itself was never one the proxy wrote.
  return encodeBucket(assignment) === letters ? assignment : null;
}
