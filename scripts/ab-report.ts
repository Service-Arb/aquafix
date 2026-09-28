// The A/B report: per experiment and variant, what PostHog counted, and
// whether `b` has beaten `a` — the rules are in docs/EXPERIMENTS.md.
//
//   POSTHOG_PERSONAL_API_KEY=phx_… npm run ab:report [-- --brand aquafix --days 90]
//
// A personal API key with `query:read` on the project (PostHog → Settings →
// Personal API keys). `POSTHOG_PROJECT_ID` defaults to 614067, the EV Invest
// project; `POSTHOG_API_HOST` to https://us.posthog.com. Visits that forced a
// variant (`forced: true`) are left out.
//
// Plain `node` runs it (type stripping), so it imports nothing but builtins.
import { pathToFileURL } from "node:url";

export const EVENTS = { exposed: "experiment_exposed", contact: "experiment_contact", lead: "experiment_lead" } as const;

/** One grouped row of the query: an event count for an experiment's variant. */
export interface Row {
  experiment: string;
  variant: string;
  event: string;
  channel: string | null;
  count: number;
  /** ISO time of the earliest such event. */
  first: string;
}

export interface Arm {
  exposures: number;
  leads: number;
  calls: number;
  whatsapp: number;
  formOpens: number;
}

export interface Experiment {
  name: string;
  /** Since the first exposure of any arm. */
  days: number;
  arms: Record<string, Arm>;
}

const emptyArm = (): Arm => ({ exposures: 0, leads: 0, calls: 0, whatsapp: 0, formOpens: 0 });

export function summarise(rows: readonly Row[], now: Date): Experiment[] {
  const byName = new Map<string, { first: number; arms: Record<string, Arm> }>();
  for (const row of rows) {
    const entry = byName.get(row.experiment) ?? { first: Infinity, arms: {} };
    byName.set(row.experiment, entry);
    const arm = (entry.arms[row.variant] ??= emptyArm());
    if (row.event === EVENTS.exposed) {
      arm.exposures += row.count;
      entry.first = Math.min(entry.first, Date.parse(row.first));
    } else if (row.event === EVENTS.lead) arm.leads += row.count;
    else if (row.event === EVENTS.contact && row.channel === "phone") arm.calls += row.count;
    else if (row.event === EVENTS.contact && row.channel === "whatsapp") arm.whatsapp += row.count;
    else if (row.event === EVENTS.contact && row.channel === "form_open") arm.formOpens += row.count;
  }
  return [...byName.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, { first, arms }]) => ({
      name,
      days: Number.isFinite(first) ? (now.getTime() - first) / 86_400_000 : 0,
      arms,
    }));
}

/** The primary metric's successes: every contact that reaches the business. */
export const contacts = (arm: Arm): number => arm.leads + arm.calls + arm.whatsapp;

/** Mulberry32: a seeded `[0, 1)` source, so a report (and a test) is reproducible. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function normal(rng: () => number): number {
  // Box–Muller; 1 - u keeps the log away from 0.
  return Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
}

/** Marsaglia–Tsang; for shape < 1, boosted by u^(1/shape). */
export function gammaSample(shape: number, rng: () => number): number {
  if (shape < 1) return gammaSample(shape + 1, rng) * Math.pow(1 - rng(), 1 / shape);
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number;
    let v: number;
    do {
      x = normal(rng);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = 1 - rng();
    if (Math.log(u) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v;
  }
}

export function betaSample(a: number, b: number, rng: () => number): number {
  const x = gammaSample(a, rng);
  return x / (x + gammaSample(b, rng));
}

export interface Comparison {
  /** P(rate_b > rate_a) under Beta(1 + successes, 1 + failures) posteriors. */
  pBetter: number;
  /** E[max(rate_a − rate_b, 0)]: the rate given up by shipping b, if a is better. */
  lossShipB: number;
  /** E[max(rate_b − rate_a, 0)]: the rate given up by keeping a. */
  lossKeepA: number;
}

/**
 * Beta-Binomial by Monte Carlo. Successes are capped at trials: the counts
 * are per page view, and a visitor who taps twice on one page is still one
 * page view that converted.
 */
export function compare(
  control: { successes: number; trials: number },
  treatment: { successes: number; trials: number },
  rng: () => number,
  draws = 100_000,
): Comparison {
  const post = ({ successes, trials }: { successes: number; trials: number }) => {
    const s = Math.min(successes, trials);
    return [1 + s, 1 + trials - s] as const;
  };
  const [aa, ab] = post(control);
  const [ba, bb] = post(treatment);
  let wins = 0;
  let lossShipB = 0;
  let lossKeepA = 0;
  for (let i = 0; i < draws; i++) {
    const a = betaSample(aa, ab, rng);
    const b = betaSample(ba, bb, rng);
    if (b > a) wins++;
    lossShipB += Math.max(a - b, 0);
    lossKeepA += Math.max(b - a, 0);
  }
  return { pBetter: wins / draws, lossShipB: lossShipB / draws, lossKeepA: lossKeepA / draws };
}

export const STOP = { days: 14, exposuresPerArm: 100, ship: 0.95, keep: 0.05 } as const;

export type Verdict = "keep running" | "ship b" | "keep a";

/**
 * docs/EXPERIMENTS.md's stop rule. Before the minimum duration and sample a
 * test keeps running whatever the probability says: early peeks at a noisy
 * metric declare winners that are not. The guardrail (lead rate) can veto a
 * `ship b` but never ships on its own.
 */
export function verdict(input: { days: number; exposures: readonly number[]; primary: number; guardrail: number }): Verdict {
  if (input.days < STOP.days || input.exposures.some(n => n < STOP.exposuresPerArm)) return "keep running";
  if (input.primary >= STOP.ship) return input.guardrail <= STOP.keep ? "keep a" : "ship b";
  if (input.primary <= STOP.keep) return "keep a";
  return "keep running";
}

export function hogql(brand: string, days: number): string {
  if (!/^[a-z0-9_-]+$/.test(brand)) throw new Error(`not a brand id: ${brand}`);
  if (!Number.isInteger(days) || days <= 0) throw new Error(`not a number of days: ${days}`);
  return `
    SELECT properties.experiment, properties.variant, event, properties.channel, count(), min(timestamp)
    FROM events
    WHERE event IN ('${EVENTS.exposed}', '${EVENTS.contact}', '${EVENTS.lead}')
      AND properties.brand_id = '${brand}'
      AND ifNull(toString(properties.forced), '') NOT IN ('true', '1')
      AND timestamp > now() - INTERVAL ${days} DAY
    GROUP BY properties.experiment, properties.variant, event, properties.channel`;
}

const pct = (n: number, d: number): string => (d === 0 ? "—" : `${((100 * n) / d).toFixed(2)} %`);

export function render(experiments: readonly Experiment[], rng: () => number): string {
  const out: string[] = [];
  for (const exp of experiments) {
    out.push(`\n${exp.name} — ${exp.days.toFixed(1)} days`);
    out.push("  arm   exposures  leads  calls  whatsapp  form_opens  contact rate  lead rate");
    for (const [variant, arm] of Object.entries(exp.arms).sort(([a], [b]) => a.localeCompare(b))) {
      out.push(
        `  ${variant.padEnd(4)}  ${String(arm.exposures).padStart(9)}  ${String(arm.leads).padStart(5)}  ${String(arm.calls).padStart(5)}  ${String(arm.whatsapp).padStart(8)}  ${String(arm.formOpens).padStart(10)}  ${pct(contacts(arm), arm.exposures).padStart(12)}  ${pct(arm.leads, arm.exposures).padStart(9)}`,
      );
    }
    const a = exp.arms["a"];
    const b = exp.arms["b"];
    if (!a || !b) {
      out.push("  verdict: keep running (an arm has no data yet)");
      continue;
    }
    const primary = compare({ successes: contacts(a), trials: a.exposures }, { successes: contacts(b), trials: b.exposures }, rng);
    const guardrail = compare({ successes: a.leads, trials: a.exposures }, { successes: b.leads, trials: b.exposures }, rng);
    out.push(`  P(b > a) contact rate ${primary.pBetter.toFixed(3)} · expected loss ship b ${(100 * primary.lossShipB).toFixed(3)} pp, keep a ${(100 * primary.lossKeepA).toFixed(3)} pp`);
    out.push(`  P(b > a) lead rate    ${guardrail.pBetter.toFixed(3)} (guardrail)`);
    out.push(`  verdict: ${verdict({ days: exp.days, exposures: [a.exposures, b.exposures], primary: primary.pBetter, guardrail: guardrail.pBetter })}`);
  }
  return out.length ? out.join("\n") : "No experiment events yet.";
}

function arg(name: string): string | undefined {
  const at = process.argv.indexOf(`--${name}`);
  return at < 0 ? undefined : process.argv[at + 1];
}

function cell(value: unknown): string | null {
  return value === null || value === undefined || value === "" ? null : String(value);
}

async function main(): Promise<void> {
  const key = process.env["POSTHOG_PERSONAL_API_KEY"];
  if (!key) throw new Error("POSTHOG_PERSONAL_API_KEY is not set (a personal API key with query:read)");
  const project = process.env["POSTHOG_PROJECT_ID"] ?? "614067";
  const host = (process.env["POSTHOG_API_HOST"] ?? "https://us.posthog.com").replace(/\/+$/, "");
  const brand = arg("brand") ?? "aquafix";
  const days = Number(arg("days") ?? 90);
  const res = await fetch(`${host}/api/projects/${project}/query/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query: hogql(brand, days) } }),
  });
  if (!res.ok) throw new Error(`PostHog answered ${res.status}: ${(await res.text()).slice(0, 500)}`);
  const body = (await res.json()) as { results?: unknown };
  if (!Array.isArray(body.results)) throw new Error("PostHog's answer has no `results` table");
  const rows: Row[] = body.results.flatMap((r: unknown) => {
    if (!Array.isArray(r)) return [];
    const [experiment, variant, event, channel, count, first]: unknown[] = r;
    const e = cell(experiment);
    const v = cell(variant);
    const ev = cell(event);
    if (!e || !v || !ev) return [];
    return [{ experiment: e, variant: v, event: ev, channel: cell(channel), count: Number(count) || 0, first: String(first) }];
  });
  console.log(`${brand}: last ${days} days, forced visits excluded`);
  console.log(render(summarise(rows, new Date()), seeded(Date.now())));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
