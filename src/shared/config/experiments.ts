import type { ExperimentConfig, Variant } from "@evinvest/experiments";

/**
 * The A/B tests running on a point's home page. `a` is always the control —
 * the page as it was — and `b` the treatment; `docs/EXPERIMENTS.md` holds each
 * hypothesis, its metric and its stop rule. Variants are one letter each: the
 * proxy spells a visitor's whole assignment into the path (`~ab`), so every
 * combination is its own cached page.
 *
 * `enabled: false` ends a test: everyone gets `a`, stored cookies are ignored
 * and forcing is refused. Shipping a winner means moving it into the control
 * code and deleting the entry.
 */
export const EXPERIMENTS = {
  /** Mobile hero: a full-width call button first, the form behind a link. */
  hero_call_first: { variants: ["a", "b"], weights: [1, 1], enabled: true },
  /** Quote form: each job's published price in the select, a fixed-price submit. */
  quote_price_anchor: { variants: ["a", "b"], weights: [1, 1], enabled: true },
} as const satisfies ExperimentConfig;

export type ExperimentId = keyof typeof EXPERIMENTS;

/** One visitor's variant of every experiment. */
export type Assignment = { readonly [K in ExperimentId]: Variant<typeof EXPERIMENTS, K> };

export const EXPERIMENT_IDS = Object.keys(EXPERIMENTS) as readonly ExperimentId[];

/** Everyone's page when no test applies: bots, the apex, a disabled test. */
export const CONTROL: Assignment = {
  hero_call_first: "a",
  quote_price_anchor: "a",
};

/** `?ab_<experiment>=<variant>` forces a variant, for QA. */
export const FORCE_PARAM = "ab_";

/**
 * Set (for the browser session) when a visit forced a variant, so every event
 * from that browser says `forced: true` and the report can leave it out.
 */
export const FORCED_COOKIE = "ab_forced";
