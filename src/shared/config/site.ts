import { defineSite, STOREFRONT_GATE, type OwnerTodo } from "@evinvest/kitstart";
import { i18n } from "./i18n";
import { LEAD } from "./lead";
import { PLACES } from "./places";

/**
 * Aquafix, as the shared landing machinery sees it: the one object routing,
 * the lead funnel, schema.org, analytics and mail read their brand facts from.
 * A point overrides only what is genuinely its own (address, phone, hours) —
 * see `entities/place`.
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
  phone: inlined("SITE_CARD_PHONE", process.env.SITE_CARD_PHONE),
  email: inlined("SITE_CARD_EMAIL", process.env.SITE_CARD_EMAIL),
  site: inlined("SITE_CARD_SITE", process.env.SITE_CARD_SITE),
} as const;

/** The Rust site's pages on the apex, which had no points; see `decide`. */
const RUST_PAGES = ["/prices", "/guarantee", "/about"] as const;

export const site = defineSite({
  brand: {
    id: "aquafix",
    name: "Aquafix",
    legalName: "Aquafix SAS",
    /** Apex: the brand page. A point lives at `<slug>.<domain>`. */
    domain: CARD.site,
    email: CARD.email,
    phone: CARD.phone,
    businessType: "Plumber",
    priceRange: "€€",
  },
  i18n,
  // `og:locale` needs a region, unlike `hreflang`; English is read in Ireland
  // and Britain, not the US.
  ogLocale: { fr: "fr_FR", en: "en_GB" },
  topology: { kind: "subdomains", apex: "directory" },
  /**
   * The pages a point has, as locale- and point-free suffixes. The proxy, the
   * sitemap, the breadcrumbs and the route tree all read this one list, so a
   * page cannot exist in one and be forgotten by another.
   */
  pages: {
    home: "",
    prices: "/prices",
    guarantee: "/guarantee",
    about: "/about",
  },
  places: PLACES,
  publication: STOREFRONT_GATE,
  lead: LEAD,
  // Unprefixed was English. `/fr/thanks` and `/en/thanks` are not moved: the
  // brand's thank-you page still lives at that path.
  legacyRedirects: [
    { from: "/thanks", to: locale => (locale === null ? "/en/thanks" : null) },
    ...RUST_PAGES.map(from => ({ from, to: (locale: string | null) => `/${locale ?? "en"}` })),
  ],
});

export const PAGES = site.pages;
export type PageKey = (typeof site.pageKeys)[number];
export const PAGE_KEYS = site.pageKeys;

/** The trade's own facts, which only this brand's copy quotes. */
export const TRADE = {
  siret: "000 000 000 00000",
  decennale: { insurer: "—", policy: "—" },
  /** Call-out fee and night/weekend surcharge, in whole euros, TVA included. */
  calloutEur: 89,
  surchargeEur: 60,
  /** How far a van drives from its point. */
  radiusKm: 30,
} as const;

/**
 * None blocks launch: the site already answers on its domain, and a blocking
 * fact would refuse the build (`assertLaunchable`). Which of these should
 * have held the launch back is the owner's call.
 */
export const OWNER_TODO: readonly OwnerTodo[] = [
  { field: "site.brand.legalName", why: "raison sociale as registered", blocksLaunch: false },
  { field: "TRADE.siret", why: "SIRET of the operating entity", blocksLaunch: false },
  { field: "TRADE.decennale", why: "insurer and policy number of the assurance décennale", blocksLaunch: false },
  { field: "site.brand.email", why: "card.toml carries val@; confirm the public mailbox", blocksLaunch: false },
  { field: "TRADE.calloutEur / surchargeEur", why: "EUR amounts carried over from the USD draft, not priced", blocksLaunch: false },
  { field: "TRADE.radiusKm", why: "service radius per point", blocksLaunch: false },
  { field: "PRICE_LIST", why: "every fromEur is the USD draft's integer, not a French price", blocksLaunch: false },
  { field: "Text.crew / Text.reviews / proof stats", why: "copy placeholders from the Portland draft", blocksLaunch: false },
];
