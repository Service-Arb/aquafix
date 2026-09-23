import { describe, expect, it } from "vitest";
import { PRICE_LIST } from "@/entities/content";
import { LOCATIONS } from "@/entities/location";
import { locationGraph } from "@/features/seo";
import { PAGE_KEYS } from "@/shared/config/routes";
import { context, royat } from "./support/fixtures";

type Node = Record<string, unknown>;
const NOW = new Date("2026-09-23T12:00:00Z");

function graph(...args: Parameters<typeof locationGraph>): Node[] {
  // Through JSON, as a crawler reads it.
  const parsed: unknown = JSON.parse(JSON.stringify(locationGraph(...args)));
  const nodes = (parsed as { "@graph": Node[] })["@graph"];
  expect(Array.isArray(nodes)).toBe(true);
  return nodes;
}

const ofType = (nodes: Node[], type: string) => nodes.filter(n => n["@type"] === type);

describe("schema.org", () => {
  it("emits one Offer per price row, from the same integer, in euros with TVA", () => {
    const { point, copy } = context(royat());
    const services = ofType(graph(point, copy, "home", NOW), "Service");
    expect(services).toHaveLength(PRICE_LIST.length);
    services.forEach((service, i) => {
      const row = PRICE_LIST[i];
      const offer = service.offers as Node;
      const spec = offer.priceSpecification as Node;
      expect(service.name).toBe(copy.t.prices[row!.id].job);
      expect(offer.price).toBe(row!.fromEur);
      expect(offer.priceCurrency).toBe("EUR");
      expect(spec.minPrice).toBe(row!.fromEur);
      expect(spec.valueAddedTaxIncluded).toBe(true);
    });
  });

  it.each(PAGE_KEYS)("never carries aggregateRating from baked data (%s)", page => {
    for (const location of LOCATIONS) {
      const { point, copy } = context(location);
      expect(JSON.stringify(graph(point, copy, page, NOW))).not.toContain("aggregateRating");
    }
  });

  it("carries Google's rating only while the mirrored copy is fresh", () => {
    const fresh = context(royat({ rating: { value: 4.7, count: 31, fetchedAt: "2026-09-20T00:00:00Z" } }));
    const [business] = ofType(graph(fresh.point, fresh.copy, "home", NOW), "Plumber");
    expect(business?.aggregateRating).toMatchObject({ ratingValue: 4.7, reviewCount: 31 });

    const stale = context(royat({ rating: { value: 4.7, count: 31, fetchedAt: "2026-08-01T00:00:00Z" } }));
    expect(JSON.stringify(graph(stale.point, stale.copy, "home", NOW))).not.toContain("aggregateRating");
  });

  it.each(LOCATIONS.map(l => [l.slug, l] as const))("addresses %s in France", (_, location) => {
    const { point, copy } = context(location);
    const [business] = ofType(graph(point, copy, "home", NOW), "Plumber");
    const address = business?.address as Node;
    expect(address.addressCountry).toBe("FR");
    expect(address.postalCode).toMatch(/^(63|69)\d{3}$/);
    expect(business?.telephone).toMatch(/^\+33/);
    expect(business?.parentOrganization).toEqual({ "@id": "https://aquafix.top/#organization" });
  });

  it("puts the FAQ only on /prices and the offers only where prices are shown", () => {
    const { point, copy } = context(royat());
    expect(ofType(graph(point, copy, "prices", NOW), "FAQPage")).toHaveLength(1);
    expect(ofType(graph(point, copy, "home", NOW), "FAQPage")).toHaveLength(0);
    expect(ofType(graph(point, copy, "about", NOW), "Service")).toHaveLength(0);
  });

  it("describes one business across languages and the canonical subdomain", () => {
    const fr = context(royat(), "fr");
    const en = context(royat(), "en");
    const id = (c: typeof fr) => ofType(graph(c.point, c.copy, "home", NOW), "Plumber")[0]?.["@id"];
    expect(id(fr)).toBe("https://royat.aquafix.top/#business");
    expect(id(en)).toBe(id(fr));
    const page = ofType(graph(en.point, en.copy, "prices", NOW), "WebPage")[0];
    expect(page?.url).toBe("https://royat.aquafix.top/en/prices");
    expect(page?.inLanguage).toBe("en");
  });
});
