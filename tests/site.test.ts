import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { site } from "@/shared/config/site";
import { GONE, HOST_MARK, pointSuffixes } from "@evinvest/kitstart";
import { NON_PAGE_ROUTES } from "@/features/request-routing";

const ROOT = join(import.meta.dirname, "..");

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

  // The proxy sends every unprefixed path but these to the 404. A route added
  // to `app/` and not to the list would answer 404; a file in `public/` too,
  // since the proxy's matcher now lets paths with an extension in.
  it("lets through exactly the routes app/ has outside [locale], and serves no public files", () => {
    const special: Record<string, string> = { "robots.ts": "/robots.txt", "sitemap.ts": "/sitemap.xml" };
    const routes = readdirSync(join(ROOT, "app"), { withFileTypes: true })
      .filter(e => (e.isDirectory() && !e.name.startsWith("[")) || special[e.name])
      .map(e => special[e.name] ?? `/${e.name}`);
    expect([...routes].sort()).toEqual([...NON_PAGE_ROUTES].sort());
    expect(existsSync(join(ROOT, "public")) ? readdirSync(join(ROOT, "public")) : []).toEqual([]);
  });

  it("takes its contact facts from the card", () => {
    expect(site.brand).toMatchObject({ id: "aquafix", domain: "aquafix.top", businessType: "Plumber" });
    expect(site.brand.phone).toMatch(/^\+33/);
  });
});
