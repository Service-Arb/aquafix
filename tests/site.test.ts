import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PASS_PATHS, pointSuffixes } from "@evinvest/kitstart";
import { describe, expect, it } from "vitest";
import { site } from "@/shared/config/site";
import { FILE_ROUTES } from "../proxy";

const ROOT = join(import.meta.dirname, "..");

describe("the site composition root", () => {
  it("lists the pages in declaration order, home first", () => {
    expect(site.pageKeys).toEqual(["home", "prices", "guarantee", "about"]);
    expect(pointSuffixes(site)).toEqual(["", "/prices", "/guarantee", "/about", "/thanks"]);
  });

  // The proxy sends every unprefixed path but these to the 404: kitstart's
  // `PASS_PATHS`, and the two metadata routes its own file guard lets through.
  // A route added to `app/` and to neither list would answer 404; so would a
  // file in `public/`, since the proxy sends every path with an extension there.
  it("lets through exactly the routes app/ has outside [locale], and serves no public files", () => {
    const special: Record<string, string> = { "robots.ts": "/robots.txt", "sitemap.ts": "/sitemap.xml" };
    const routes = readdirSync(join(ROOT, "app"), { withFileTypes: true })
      .filter(e => (e.isDirectory() && !e.name.startsWith("[")) || special[e.name])
      .map(e => special[e.name] ?? `/${e.name}`);
    expect([...routes].sort()).toEqual([...PASS_PATHS, ...FILE_ROUTES].sort());
    expect(existsSync(join(ROOT, "public")) ? readdirSync(join(ROOT, "public")) : []).toEqual([]);
  });

  it("takes its contact facts from the card", () => {
    expect(site.brand).toMatchObject({ id: "aquafix", domain: "aquafix.top", businessType: "Plumber" });
    expect(site.brand.phone).toMatch(/^\+33/);
  });
});
