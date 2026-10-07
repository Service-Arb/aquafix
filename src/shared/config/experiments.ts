import type { ExperimentConfig, OverriddenConfig, Variant } from "@evinvest/experiments";

/**
 * The A/B tests running on a point's home page. `a` is always the control —
 * the page as it was — and `b` the treatment; `docs/EXPERIMENTS.md` holds each
 * hypothesis, its metric and its stop rule. Variants are one letter each: the
 * proxy spells a visitor's whole assignment into the path (`~ab`), so every
 * combination is its own cached page.
 *
 * The weights, `enabled` and `holdout` here are the defaults: the Service-Arb
 * panel overrides them without a deploy (`features/experiments`, applied with
 * `applyOverrides`). `enabled: false` ends a test: everyone gets `a`, stored
 * cookies are ignored and forcing is refused. The variants are the code's
 * alone. Shipping a winner means moving it into the control code and deleting
 * the entry.
 */
export const EXPERIMENTS = {
  /** Mobile hero: a full-width call button first, the form behind a link. */
  hero_call_first: { variants: ["a", "b"], weights: [1, 1], enabled: true },
  /**
   * Lead form: the compact card on one screen (`a`), one question per screen
   * (`b`), or "how urgent?" first (`c`). `a` and `b` are vifnet's arms under
   * the same key, so the two brands' results pool; `c` is this brand's own.
   */
  lead_form: { variants: ["a", "b", "c"], weights: [1, 1, 1], enabled: true },
  /**
   * How the card offers WhatsApp and the brand's Telegram bot
   * (MESSENGER-CHANNELS-SPEC §4): `a` the control, `b`–`g` the Figma boards
   * AQ-1…AQ-6. Any arm but `a` draws the compact card, whatever `lead_form`
   * says — the `lead_form` events of such a visitor say `superseded`.
   */
  lead_channel: { variants: ["a", "b", "c", "d", "e", "f", "g"], weights: [1, 1, 1, 1, 1, 1, 1], enabled: true },
} as const satisfies ExperimentConfig;

export type ExperimentId = keyof typeof EXPERIMENTS;

/** {@link EXPERIMENTS} with the panel's overrides laid over it: what every reader of a variant goes by. */
export type LiveExperiments = OverriddenConfig<typeof EXPERIMENTS>;

/**
 * Each test's hypothesis in one line (at most 200 characters), declared to the
 * panel at start (`experiments.declared`); the full text is docs/EXPERIMENTS.md.
 */
export const EXPERIMENT_SUMMARIES: { readonly [K in ExperimentId]: string } = {
  hero_call_first: "On a phone, a full-width call button first, the form behind a link, turns more visits into contacts.",
  lead_form:
    "One question per screen (b), or urgency first with an urgent call-back and job cards (c), lifts leads per visit over the compact one-screen form (a).",
  lead_channel:
    "WhatsApp first in the lead card, its message prefilled, the bot and a call beside it (AQ-1..AQ-6, b-g), lifts contacts per visit over the phone-only form (a).",
};

/** One visitor's variant of every experiment. */
export type Assignment = { readonly [K in ExperimentId]: Variant<typeof EXPERIMENTS, K> };

export const EXPERIMENT_IDS = Object.keys(EXPERIMENTS) as readonly ExperimentId[];

/** Everyone's page when no test applies: bots, the apex, a disabled test. */
export const CONTROL: Assignment = {
  hero_call_first: "a",
  lead_form: "a",
  lead_channel: "a",
};

/**
 * The QA menu's words for each test and each arm. Keyed by the config, so a
 * new experiment or arm without a label fails the type check rather than
 * showing a bare letter.
 */
const AB_MENU_LABELS: {
  readonly [K in ExperimentId]: { readonly label: string; readonly variants: { readonly [V in Variant<typeof EXPERIMENTS, K>]: string } };
} = {
  hero_call_first: { label: "Mobile hero", variants: { a: "Form first", b: "Call first" } },
  lead_form: { label: "Lead form", variants: { a: "Compact", b: "Steps", c: "Urgent first" } },
  lead_channel: {
    label: "Lead channel",
    variants: { a: "Control", b: "AQ-1 select", c: "AQ-2 segment", d: "AQ-3 thanks", e: "AQ-4 swap", f: "AQ-5 saga", g: "AQ-6 urgency" },
  },
};

/**
 * The experiments as kitstart's `AbSwitcher` takes them: plain data, so a
 * server layout passes it. Marked pure because the client beacon imports this
 * module: unread, the list and its labels drop out of every visitor's bundle.
 */
export const AB_SWITCHER_EXPERIMENTS = /* @__PURE__ */ EXPERIMENT_IDS.map(key => ({
  key,
  label: AB_MENU_LABELS[key].label,
  variants: Object.entries(AB_MENU_LABELS[key].variants).map(([value, label]) => ({ value, label })),
}));

/** `?ab_<experiment>=<variant>` forces a variant, for QA. */
export const FORCE_PARAM = "ab_";

/**
 * Set when a visit forced a variant, so every event from that browser says
 * `forced: true` and PostHog's funnel can leave it out. The same name on every
 * brand (vifnet's), so one QA habit works on all of them. Starting with the
 * assignment prefix is safe: no experiment is keyed `_qa`. Its value is the
 * visitor's own variants (`encodeQaSnapshot`), given back when a point's home
 * is opened without a force; any non-empty value marks the visit.
 */
export const QA_COOKIE = "ab__qa";

/**
 * The QA mark's name before {@link QA_COOKIE}. Still read as a mark, and
 * dropped by the proxy on the browser's next visit to a point: it holds no
 * snapshot to give back, and a forced visit sets the new name. Read until
 * 2026-11-05, then delete — the 30-day mark set on the last day of the old
 * name has expired by then.
 */
export const LEGACY_QA_COOKIE = "ab_forced";

/**
 * As long as the variant cookies it marks (30 days): a session-only mark
 * expired with the browser while the forced variant stayed, and QA's later
 * visits counted as real ones in that arm. Its snapshot must outlive them too,
 * or leaving QA would have nothing to give back.
 */
export const FORCED_MAX_AGE = 60 * 60 * 24 * 30;
