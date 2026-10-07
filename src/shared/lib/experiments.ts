import { cookieName, resolveVariant } from "@evinvest/experiments";
import {
  AB_SWITCHER_EXPERIMENTS,
  CONTROL,
  EXPERIMENT_IDS,
  EXPERIMENTS,
  LEGACY_QA_COOKIE,
  QA_COOKIE,
  type Assignment,
  type ExperimentId,
  type LiveExperiments,
} from "@/shared/config/experiments";

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
 * Whether `lead_channel` runs on a card (MESSENGER-CHANNELS-SPEC §4,
 * precedence): only at a place with its own WhatsApp — `channels` is the
 * card's `channels_available` (kitstart's `channelsAvailable`), `wa,tg` or
 * `wa`. There every arm, the control `a` included, draws the compact card
 * (`lead_form` `a`) and the card's events name `lead_channel`, so the two
 * tests' effects never mix; `b`–`g` add their board. Elsewhere — the bot
 * alone (kitstart draws the control in every arm then: six identical arms
 * would only take traffic from `lead_form`), or neither — the test is inert
 * and the card is `lead_form`'s.
 */
export function leadChannelRuns(channels: string | null): boolean {
  return channels === "wa,tg" || channels === "wa";
}

/**
 * Whether a test's arm is not what the page drew, because another test's arm
 * overrides it: a card that names `lead_channel` ({@link leadChannelRuns})
 * replaced `lead_form`'s arm. `card` is the experiment the card itself names —
 * its `data-experiment` on the page, the `experiment` field it posts — so the
 * mark follows what was drawn, whatever the cookies say. `lead_form`'s
 * exposure, contact and lead still count, marked `superseded`, so PostHog
 * leaves them out of `lead_form`'s funnel (docs/EXPERIMENTS.md).
 */
export function isSuperseded(id: ExperimentId, card: string | null): boolean {
  return id === "lead_form" && card === "lead_channel";
}

/** The `ab_*` cookies this browser carries for experiments `config` has switched off. */
export function disabledCookies(config: LiveExperiments, read: (name: string) => string | undefined): string[] {
  return EXPERIMENT_IDS.filter(id => config[id].enabled === false && read(cookieName(id)) !== undefined).map(id => cookieName(id));
}

/**
 * Whether the browser carries QA's mark: {@link QA_COOKIE} with any non-empty
 * value — kitstart's `qaVisit` and the menu's gate go by the same rule, and
 * the value is the visitor's own variants ({@link encodeQaSnapshot}), or `1`
 * on a browser marked before the snapshot. The legacy name was only ever
 * written as `1`, so it keeps its exact test until it is deleted.
 */
export function isForced(read: (name: string) => string | undefined): boolean {
  return (read(QA_COOKIE) ?? "") !== "" || read(LEGACY_QA_COOKIE) === "1";
}

/** A visitor's own variants, saved while QA forces others, so leaving QA gives them back. */
export type QaSnapshot = Partial<Record<ExperimentId, string>>;

const SNAPSHOT_PAIR = ".";
const SNAPSHOT_SEPARATOR = "~";
/**
 * The snapshot with no entry. Never empty: an empty `ab__qa` is no mark at all
 * to kitstart (`qaVisit`, `abSwitcherVisible`), and the forced visit holding
 * it would lose its menu and its `forced: true`. Unreachable today — a force
 * needs a running test, and the proxy assigns every running one first — so it
 * only keeps the encoding total.
 */
const EMPTY_SNAPSHOT = "-";

/**
 * {@link QaSnapshot} as {@link QA_COOKIE}'s value:
 * `hero_call_first.a~lead_form.b~lead_channel.c`. Keys are snake_case and
 * variants one letter, so it needs no percent-encoding in a cookie.
 */
export function encodeQaSnapshot(snapshot: QaSnapshot): string {
  const pairs = EXPERIMENT_IDS.flatMap(id => {
    const variant = snapshot[id];
    return variant === undefined ? [] : [`${id}${SNAPSHOT_PAIR}${variant}`];
  });
  return pairs.length === 0 ? EMPTY_SNAPSHOT : pairs.join(SNAPSHOT_SEPARATOR);
}

/**
 * Inverse of {@link encodeQaSnapshot}, or `null` for a value that is no
 * snapshot — `1` from before the snapshot, or anything a hand put there. A
 * variant is checked against the code's list, not the applied config: a test
 * the panel paused still gets its visitor's variant back when it resumes.
 */
export function decodeQaSnapshot(value: string | undefined): QaSnapshot | null {
  if (value === undefined) return null;
  if (value === EMPTY_SNAPSHOT) return {};
  const out: QaSnapshot = {};
  for (const pair of value.split(SNAPSHOT_SEPARATOR)) {
    const [key = "", variant = "", ...extra] = pair.split(SNAPSHOT_PAIR);
    const id = EXPERIMENT_IDS.find(known => known === key);
    if (id === undefined || extra.length > 0) return null;
    const declared: readonly string[] = EXPERIMENTS[id].variants;
    if (!declared.includes(variant)) return null;
    out[id] = variant;
  }
  return out;
}

/**
 * Words the QA menu adds to `lead_channel`'s label at a point where the test
 * is inert ({@link leadChannelRuns}): every arm draws the same card there, so
 * a tap seems to change nothing.
 */
const LEAD_CHANNEL_INERT = " — inactive here (no WhatsApp)";

/**
 * The QA menu's tests for one point: {@link AB_SWITCHER_EXPERIMENTS}, with
 * `lead_channel` saying so where it cannot change the page. `channels` is the
 * point's `channels_available`, as {@link leadChannelRuns} takes it.
 */
export function abSwitcherExperiments(channels: string | null): typeof AB_SWITCHER_EXPERIMENTS {
  if (leadChannelRuns(channels)) return AB_SWITCHER_EXPERIMENTS;
  return AB_SWITCHER_EXPERIMENTS.map(e => (e.key === "lead_channel" ? { ...e, label: `${e.label}${LEAD_CHANNEL_INERT}` } : e));
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
