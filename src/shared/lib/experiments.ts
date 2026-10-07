import { cookieName, resolveVariant } from "@evinvest/experiments";
import { CONTROL, EXPERIMENT_IDS, LEGACY_QA_COOKIE, QA_COOKIE, type Assignment, type ExperimentId, type LiveExperiments } from "@/shared/config/experiments";

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

/**
 * The enabled experiments this browser carries a cookie for, with their
 * variants. `config` is the applied one on the server (`LiveExperiments`);
 * the browser has only the code's, and relies on the proxy having dropped the
 * cookie of a test the panel switched off.
 */
export function assignedVariants(config: LiveExperiments, read: (name: string) => string | undefined): Partial<Record<ExperimentId, string>> {
  const out: Partial<Record<ExperimentId, string>> = {};
  for (const id of EXPERIMENT_IDS) {
    if (config[id].enabled === false) continue;
    const raw = read(cookieName(id));
    if (raw === undefined) continue;
    out[id] = resolveVariant(config, id, raw);
  }
  return out;
}

/** The page a request should see: its cookies' variants, control where it has none or the test is off. */
export function assignmentOf(config: LiveExperiments, read: (name: string) => string | undefined): Assignment {
  return {
    hero_call_first: resolveVariant(config, "hero_call_first", read(cookieName("hero_call_first"))),
    lead_form: resolveVariant(config, "lead_form", read(cookieName("lead_form"))),
    lead_channel: resolveVariant(config, "lead_channel", read(cookieName("lead_channel"))),
  };
}

/**
 * Whether a `lead_channel` arm draws the card (MESSENGER-CHANNELS-SPEC §4,
 * precedence): any arm but the control, at a place that offers a messenger —
 * `channels` is the card's `channels_available` (`wa,tg` | `wa` | `tg` |
 * `none`, kitstart's `channelsAvailable`). There it draws the compact card
 * with its board, whatever `lead_form` says; at a place with neither WhatsApp
 * nor a bot the arm is inert and the card is `lead_form`'s. Unknown (`null`:
 * no card read) is inert.
 */
export function channelArmDraws(arm: string | undefined, channels: string | null): boolean {
  return arm !== undefined && arm !== CONTROL.lead_channel && channels !== null && channels !== "none";
}

/**
 * Whether a test's arm is not what the page drew, because another test's arm
 * overrides it: a `lead_channel` arm that draws the card ({@link
 * channelArmDraws}) replaces `lead_form`'s. Its `lead_form` exposure and lead
 * still count, marked `superseded`, so PostHog leaves them out of
 * `lead_form`'s funnel (docs/EXPERIMENTS.md).
 */
export function isSuperseded(id: ExperimentId, variants: Partial<Record<ExperimentId, string>>, channels: string | null): boolean {
  return id === "lead_form" && channelArmDraws(variants.lead_channel, channels);
}

/** The `ab_*` cookies this browser carries for experiments `config` has switched off. */
export function disabledCookies(config: LiveExperiments, read: (name: string) => string | undefined): string[] {
  return EXPERIMENT_IDS.filter(id => config[id].enabled === false && read(cookieName(id)) !== undefined).map(id => cookieName(id));
}

/** Whether the browser carries QA's mark, under its name or the legacy one the proxy has yet to move. */
export function isForced(read: (name: string) => string | undefined): boolean {
  return read(QA_COOKIE) === "1" || read(LEGACY_QA_COOKIE) === "1";
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

/**
 * Inverse of {@link encodeBucket} under `config`; anything that is not a real,
 * non-control assignment is `null` — a `b` for a test `config` has off included.
 */
export function decodeBucket(config: LiveExperiments, letters: string): Assignment | null {
  if (letters.length !== EXPERIMENT_IDS.length) return null;
  const assignment = assignmentOf(config, name => {
    const index = EXPERIMENT_IDS.findIndex(id => cookieName(id) === name);
    return index < 0 ? undefined : letters[index];
  });
  // `resolveVariant` turned anything invalid (or a disabled test) into control;
  // a segment that does not re-encode to itself was never one the proxy wrote.
  return encodeBucket(assignment) === letters ? assignment : null;
}
