import { describe, expect, it } from "vitest";
import { isPublished, LOCATIONS, publicationGaps } from "@/entities/location";
import { locationMetadata } from "@/features/seo";
import { context, publishedRoyat, royat } from "./support/fixtures";

describe("the publication gate", () => {
  it("holds every point back until the owner fills its local fields", () => {
    for (const location of LOCATIONS) {
      expect(publicationGaps(location)).toEqual(["storefrontPhoto", "landmark", "serviceArea", "hours"]);
      expect(isPublished(location)).toBe(false);
    }
  });

  it("opens only when all four are there", () => {
    expect(isPublished(publishedRoyat())).toBe(true);
    expect(publicationGaps(publishedRoyat({ hours: [] }))).toEqual(["hours"]);
    expect(publicationGaps(publishedRoyat({ serviceArea: [] }))).toEqual(["serviceArea"]);
    expect(publicationGaps(publishedRoyat({ landmark: { fr: "Place", en: " " } }))).toEqual(["landmark"]);
  });

  it("serves an unpublished point noindex, and a published one indexable", () => {
    const held = context(royat());
    expect(locationMetadata(held.point, held.copy, "home").robots).toMatchObject({ index: false });
    const open = context(publishedRoyat());
    expect(locationMetadata(open.point, open.copy, "home").robots).toMatchObject({ index: true });
  });

  it("points the canonical at the subdomain and names both languages plus x-default", () => {
    const { point, copy } = context(royat(), "en");
    const meta = locationMetadata(point, copy, "prices");
    expect(meta.alternates?.canonical).toBe("https://royat.aquafix.top/en/prices");
    expect(meta.alternates?.languages).toEqual({
      "fr-FR": "https://royat.aquafix.top/fr/prices",
      en: "https://royat.aquafix.top/en/prices",
      "x-default": "https://royat.aquafix.top/fr/prices",
    });
  });
});
