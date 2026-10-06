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
};

/** One visitor's variant of every experiment. */
export type Assignment = { readonly [K in ExperimentId]: Variant<typeof EXPERIMENTS, K> };

export const EXPERIMENT_IDS = Object.keys(EXPERIMENTS) as readonly ExperimentId[];

/** Everyone's page when no test applies: bots, the apex, a disabled test. */
export const CONTROL: Assignment = {
  hero_call_first: "a",
  lead_form: "a",
};

/** `?ab_<experiment>=<variant>` forces a variant, for QA. */
export const FORCE_PARAM = "ab_";

/**
 * Set (for the browser session) when a visit forced a variant, so every event
 * from that browser says `forced: true` and PostHog's funnel can leave it out.
 */
export const FORCED_COOKIE = "ab_forced";
