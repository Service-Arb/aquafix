import type { Locale } from "@/shared/config/i18n";

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface PostalAddress {
  street: string;
  postalCode: string;
  locality: string;
  /** Région administrative, as schema.org `addressRegion`. */
  region: string;
  country: "FR";
}

export interface OpeningHours {
  days: readonly DayOfWeek[];
  /** `HH:MM`, local time. */
  opens: string;
  closes: string;
}

/**
 * Google's rating for the point, mirrored from the Business Profile API. Never
 * baked: it exists only when the live source supplied it, and the API's terms
 * cap how long a copy may be shown, so `fetchedAt` travels with it.
 */
export interface Rating {
  value: number;
  count: number;
  /** ISO 8601. */
  fetchedAt: string;
}

/** One point, as the page renders it — baked config merged with live data. */
export interface Location {
  slug: string;
  /** The Google Business Profile's own name — the schema.org `name`. */
  gbpName: string;
  /** The short place name the copy uses: "Royat", "Lyon 3e". */
  place: Record<Locale, string>;
  address: PostalAddress;
  /** As printed, international. */
  phone: string;
  /** International number the WhatsApp link opens. */
  whatsapp: string;
  geo: { lat: number; lng: number } | null;
  // ── the publication gate: a point is indexable only when all four are known
  /** Absolute URL of the storefront or van photo taken at the point. */
  storefrontPhoto: string | null;
  /** How a visitor recognises the place — a local landmark, per language. */
  landmark: Record<Locale, string> | null;
  /** Communes the van drives to from this point. */
  serviceArea: readonly string[] | null;
  hours: readonly OpeningHours[] | null;
  // ── live only
  rating: Rating | null;
}
