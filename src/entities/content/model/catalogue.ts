/**
 * The language-free half of the copy: which jobs, prices, services and photos
 * exist, in what order, and what they cost. Written once; `Text` gives each id
 * its words in each language through a `Record` over these ids, so a French
 * price that drifts from its English twin cannot exist — there is one number.
 */

// The jobs are the lead schema's subjects, so they live with it in the site config.
export { JOB_IDS, type JobId } from "@/shared/config/lead";

export type PriceId =
  | "drain"
  | "tap"
  | "toilet"
  | "water_heater_repair"
  | "water_heater_replace"
  | "pipe"
  | "camera"
  | "sewer"
  | "repipe";

export interface PriceRow {
  id: PriceId;
  /**
   * Whole euros, TVA included. The table cell and the schema.org `Offer` are
   * both formatted from this one integer, so they cannot disagree.
   */
  fromEur: number;
}

/**
 * TODO(owner): every amount is the USD draft's integer relabelled, not a
 * French price. See `OWNER_TODO`.
 */
export const PRICE_LIST: readonly PriceRow[] = [
  { id: "drain", fromEur: 149 },
  { id: "tap", fromEur: 129 },
  { id: "toilet", fromEur: 189 },
  { id: "water_heater_repair", fromEur: 215 },
  { id: "water_heater_replace", fromEur: 1290 },
  { id: "pipe", fromEur: 265 },
  { id: "camera", fromEur: 199 },
  { id: "sewer", fromEur: 390 },
  { id: "repipe", fromEur: 4800 },
];

export function priceOf(id: PriceId): number {
  const row = PRICE_LIST.find(p => p.id === id);
  if (!row) throw new Error(`no price row ${id}`);
  return row.fromEur;
}

export type ServiceId = "drains" | "pipes" | "heaters" | "taps" | "sewers" | "leaks" | "repipes" | "fit_out";

/** A service quotes a row of the price list, or is quoted on site (`null`). */
export const SERVICE_LIST: readonly { id: ServiceId; from: PriceId | null }[] = [
  { id: "drains", from: "drain" },
  { id: "pipes", from: "pipe" },
  { id: "heaters", from: "water_heater_repair" },
  { id: "taps", from: "tap" },
  { id: "sewers", from: "sewer" },
  { id: "leaks", from: "camera" },
  { id: "repipes", from: "repipe" },
  { id: "fit_out", from: null },
];

export const WORK_IDS = ["drains", "taps", "heaters", "pipes"] as const;
export type WorkId = (typeof WORK_IDS)[number];

export const NAV_IDS = ["prices", "guarantee", "reviews", "about"] as const;
export type NavId = (typeof NAV_IDS)[number];

/** Where each nav entry points, as a page suffix (and fragment). */
export const NAV_SUFFIX: Record<NavId, string> = {
  prices: "/prices",
  guarantee: "/guarantee",
  reviews: "#reviews",
  about: "/about",
};
