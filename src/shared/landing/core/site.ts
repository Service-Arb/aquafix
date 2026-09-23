import type { LocaleRegistry } from "@evinvest/i18n";

/**
 * The composition root of a landing site: every brand fact the shared
 * machinery reads — routing, the lead funnel, schema.org, analytics, mail —
 * arrives through one object built by `defineSite`, instead of each slice
 * importing the brand's constants. This module is the seam a future shared
 * landing package will own, so it stays pure: no React, no Next, no `node:*`,
 * and nothing from the brand app.
 */
export interface BrandFacts {
  /** `brand_id` in analytics, the `data-brand` palette scope, the header prefix. */
  id: string;
  name: string;
  legalName: string;
  email: string | null;
  /** As printed, international; `null` → no `tel:` channel. */
  phone: string | null;
  /** The apex; `null` → nothing is indexable. */
  domain: string | null;
  /** schema.org type of each point's business node: `"Plumber"`, `"LocalBusiness"`… */
  businessType: string;
  priceRange?: string;
}

/**
 * How points map onto hosts. `subdomains`: one point per `<slug>.<domain>`,
 * the apex a directory of them. `single`: the whole site is one point.
 */
export type Topology = { kind: "subdomains"; apex: "directory" } | { kind: "single"; place: string };

/** A locale- and point-free page suffix: `""` is home, `"/prices"` a subpage. */
export type PageSuffix = `/${string}` | "";

/**
 * A path an earlier site served on the apex. `to` gets the path's locale
 * prefix (`null` when unprefixed) and answers where it moved, or `null` when a
 * prefixed twin is still a live page.
 */
export interface LegacyRedirect<L extends string> {
  from: string;
  to: (locale: L | null) => string | null;
}

export interface SiteConfig<L extends string, P extends string, B extends BrandFacts> {
  brand: B;
  i18n: LocaleRegistry<L>;
  topology: Topology;
  /** Every indexable page of a point; `home` is required. */
  pages: Readonly<Record<P | "home", PageSuffix>>;
  legacyRedirects?: readonly LegacyRedirect<L>[];
}

export interface Site<L extends string, P extends string, B extends BrandFacts> extends SiteConfig<L, P, B> {
  readonly pageKeys: readonly (P | "home")[];
  /**
   * Request headers only the proxy may set: how a point's links are written
   * on this host, and the internal path a request was routed to.
   */
  readonly headers: { readonly linkMode: string; readonly route: string };
}

export function defineSite<L extends string, P extends string, B extends BrandFacts>(
  config: SiteConfig<L, P, B>,
): Site<L, P, B> {
  const pageKeys = Object.keys(config.pages).filter((k): k is P | "home" => Object.hasOwn(config.pages, k));
  return {
    ...config,
    pageKeys,
    headers: { linkMode: `x-${config.brand.id}-link-mode`, route: `x-${config.brand.id}-route` },
  };
}
