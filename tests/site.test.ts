import { describe, expect, it } from "vitest";
import { site } from "@/shared/config/site";
import { GONE, HOST_MARK, pointSuffixes } from "@/shared/landing/core/routing";

describe("the site composition root", () => {
  it("lists the pages in declaration order, home first", () => {
    expect(site.pageKeys).toEqual(["home", "prices", "guarantee", "about"]);
    expect(pointSuffixes(site)).toEqual(["", "/prices", "/guarantee", "/about", "/thanks"]);
  });

  it("gives no point a slug the proxy reserves", () => {
    for (const slug of site.placeSlugs) {
      expect(slug, slug).not.toBe(GONE);
      expect(slug.startsWith(HOST_MARK), slug).toBe(false);
    }
  });

  it("takes its contact facts from the card", () => {
    expect(site.brand).toMatchObject({ id: "aquafix", domain: "aquafix.top", businessType: "Plumber" });
    expect(site.brand.phone).toMatch(/^\+33/);
  });
});
