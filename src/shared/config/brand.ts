/**
 * The brand: the facts every location shares. A location overrides only what
 * is genuinely its own (address, phone, hours) — see `entities/location`.
 *
 * Values marked in `OWNER_TODO` are placeholders the owner has not supplied
 * yet. They are rendered as written, so each one is listed here, once, rather
 * than discovered on the page.
 */

function inlined(name: string, value: string | undefined): string {
  // Inlined by `next.config.ts` / `vitest.config.ts` from `assets/card.toml`.
  // Absent means the build skipped the card, and a site with no phone number
  // is worse than one that does not build.
  if (!value) throw new Error(`${name} was not inlined — build through next.config.ts`);
  return value;
}

export const CARD = {
  phone: inlined("AQUAFIX_CARD_PHONE", process.env.AQUAFIX_CARD_PHONE),
  email: inlined("AQUAFIX_CARD_EMAIL", process.env.AQUAFIX_CARD_EMAIL),
  site: inlined("AQUAFIX_CARD_SITE", process.env.AQUAFIX_CARD_SITE),
} as const;

export const BRAND = {
  /** `brand_id` in analytics, the `data-brand` palette scope. */
  id: "aquafix",
  name: "Aquafix",
  legalName: "Aquafix SAS",
  /** Apex: the brand page. A location lives at `<slug>.<domain>`. */
  domain: CARD.site,
  email: CARD.email,
  phone: CARD.phone,
  siret: "000 000 000 00000",
  decennale: { insurer: "—", policy: "—" },
  /** Call-out fee and night/weekend surcharge, in whole euros, TVA included. */
  calloutEur: 89,
  surchargeEur: 60,
  /** How far a van drives from its point. */
  radiusKm: 30,
  priceRange: "€€",
} as const;

export interface OwnerTodo {
  field: string;
  why: string;
}

export const OWNER_TODO: readonly OwnerTodo[] = [
  { field: "BRAND.legalName", why: "raison sociale as registered" },
  { field: "BRAND.siret", why: "SIRET of the operating entity" },
  { field: "BRAND.decennale", why: "insurer and policy number of the assurance décennale" },
  { field: "BRAND.email", why: "card.toml carries val@; confirm the public mailbox" },
  { field: "BRAND.calloutEur / surchargeEur", why: "EUR amounts carried over from the USD draft, not priced" },
  { field: "BRAND.radiusKm", why: "service radius per point" },
  { field: "PRICE_LIST", why: "every fromEur is the USD draft's integer, not a French price" },
  { field: "Text.crew / Text.reviews / proof stats", why: "copy placeholders from the Portland draft" },
];
