import { describe, expect, it } from "vitest";
import { site } from "@/shared/config/site";
import { pointSuffixes } from "@/shared/landing/core/routing";

describe("the site composition root", () => {
  it("keeps the proxy's header names the deployed site already uses", () => {
    // Renaming either would let a stale client-sent value through the strip for one deploy.
    expect(site.headers).toEqual({ linkMode: "x-aquafix-link-mode", route: "x-aquafix-route" });
  });

  it("lists the pages in declaration order, home first", () => {
    expect(site.pageKeys).toEqual(["home", "prices", "guarantee", "about"]);
    expect(pointSuffixes(site)).toEqual(["", "/prices", "/guarantee", "/about", "/thanks"]);
  });

  it("takes its contact facts from the card", () => {
    expect(site.brand).toMatchObject({ id: "aquafix", domain: "aquafix.top", businessType: "Plumber" });
    expect(site.brand.phone).toMatch(/^\+33/);
  });
});
