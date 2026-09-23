import { describe, expect, it } from "vitest";
import { placeView, type Place } from "@/entities/place";
import { businessNode } from "@/features/seo";
import {
  isPublished,
  mergeLive,
  parsePlaceLive,
  publicationGaps,
  SERVICE_AREA_GATE,
  STOREFRONT_GATE,
} from "@/shared/landing/core/place";
import { publishedRoyat, royat } from "./support/fixtures";

const NOW = new Date("2026-09-23T12:00:00Z");

/** A business with no front: it goes to the customer, and says where. */
const sab = (over: Partial<Place> = {}): Place => ({
  slug: "royat",
  gbpName: "Aquafix Service",
  name: { fr: "Royat", en: "Royat" },
  presence: { kind: "service-area" },
  serviceArea: [
    { kind: "localities", names: ["Royat", "Ceyrat"] },
    { kind: "radius", center: { lat: 45.77, lng: 3.05 }, km: 15 },
  ],
  channels: { phone: null, whatsapp: null },
  hours: [{ days: ["Monday"], opens: "08:00", closes: "18:00" }],
  rating: null,
  ...over,
});

describe("the publication gate as a policy", () => {
  it("asks a storefront for its front and a service area only for its zone and hours", () => {
    expect(publicationGaps(sab(), STOREFRONT_GATE)).toEqual(["storefrontPhoto", "landmark"]);
    expect(publicationGaps(sab(), SERVICE_AREA_GATE)).toEqual([]);
    expect(publicationGaps(sab({ hours: null }), SERVICE_AREA_GATE)).toEqual(["hours"]);
    expect(publicationGaps(publishedRoyat(), STOREFRONT_GATE)).toEqual([]);
  });

  it("publishes nothing on a site without a domain", () => {
    expect(isPublished(sab(), SERVICE_AREA_GATE, { domain: "example.fr" })).toBe(true);
    expect(isPublished(sab(), SERVICE_AREA_GATE, { domain: null })).toBe(false);
  });
});

describe("a service-area business in schema.org", () => {
  const node = JSON.parse(JSON.stringify(businessNode(placeView(sab(), "fr", "host"), NOW))) as Record<string, unknown>;

  it("has no address, pin or photo", () => {
    expect(node).not.toHaveProperty("address");
    expect(node).not.toHaveProperty("geo");
    expect(node).not.toHaveProperty("image");
  });

  it("says where it goes: its communes and its radius", () => {
    expect(node.areaServed).toEqual([
      { "@type": "Place", name: "Royat" },
      { "@type": "Place", name: "Ceyrat" },
      {
        "@type": "GeoCircle",
        geoMidpoint: { "@type": "GeoCoordinates", latitude: 45.77, longitude: 3.05 },
        geoRadius: 15000,
      },
    ]);
  });
});

describe("the live overlay", () => {
  const live = parsePlaceLive(
    {
      address: { street: "1 Rue X", postalCode: "63130", locality: "Royat" },
      geo: { lat: 1, lng: 2 },
      storefrontPhoto: "https://cdn.example/x.jpg",
      phone: "+33 4 22 22 22 22",
    },
    ["fr", "en"],
  );

  it("never gives a service-area place a front", () => {
    const merged = mergeLive(sab(), live);
    expect(merged.presence).toEqual({ kind: "service-area" });
    expect(merged.channels.phone).toBe("+33 4 22 22 22 22");
  });

  it("merges a storefront's fields as before", () => {
    const merged = mergeLive(royat(), live);
    expect(merged.presence).toMatchObject({
      kind: "storefront",
      address: { street: "1 Rue X", postalCode: "63130", locality: "Royat", country: "FR" },
      geo: { lat: 1, lng: 2 },
      storefrontPhoto: "https://cdn.example/x.jpg",
    });
  });

  it("takes a landmark only in every language", () => {
    expect(parsePlaceLive({ landmark: { fr: "Ici" } }, ["fr", "en"])).toEqual({});
    expect(parsePlaceLive({ landmark: { fr: "Ici", en: "Here" } }, ["fr", "en"])).toEqual({
      landmark: { fr: "Ici", en: "Here" },
    });
  });
});
