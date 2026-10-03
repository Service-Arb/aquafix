import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { NON_PAGE_ROUTES, pointSuffixes } from "@evinvest/kitstart";
import { describe, expect, it } from "vitest";
import { site } from "@/shared/config/site";

const ROOT = join(import.meta.dirname, "..");
const PRICED_ONLY: readonly string[] = ["/quote/booking", "/quote/confirm"];

describe("the site composition root", () => {
  it("lists the pages in declaration order, home first", () => {
    expect(site.pageKeys).toEqual(["home", "prices", "guarantee", "about"]);
    expect(pointSuffixes(site)).toEqual(["", "/prices", "/guarantee", "/about", "/thanks"]);
  });

  // The proxy sends every unprefixed path but kitstart's `NON_PAGE_ROUTES` to
  // the 404 (the site lists no `publicFiles`). A route added to `app/` and not
  // there would answer 404; so would a file in `public/`.
  it("lets through exactly the routes app/ has outside [locale], and serves no public files", () => {
    const special: Record<string, string> = { "robots.ts": "/robots.txt", "sitemap.ts": "/sitemap.xml" };
    const routes = readdirSync(join(ROOT, "app"), { withFileTypes: true })
      .filter(e => (e.isDirectory() && !e.name.startsWith("[")) || special[e.name])
      .map(e => special[e.name] ?? `/${e.name}`);
    const mounted = NON_PAGE_ROUTES.filter(r => !PRICED_ONLY.includes(r));
    expect([...routes].sort()).toEqual([...mounted].sort());
    expect(existsSync(join(ROOT, "public")) ? readdirSync(join(ROOT, "public")) : []).toEqual([]);
  });

  // Booking and the price confirmation only ever follow a priced lead, and
  // every aquafix job is a quote: nothing posts to them. Mounting them belongs
  // with the first estimate or fixed price, and then this list shrinks.
  it("mounts none of kitstart's priced-lead routes", () => {
    expect(PRICED_ONLY.every(r => NON_PAGE_ROUTES.includes(r))).toBe(true);
    expect(PRICED_ONLY.filter(r => existsSync(join(ROOT, "app", r)))).toEqual([]);
    expect(site.lead.flows).toBeUndefined();
  });

  it("takes its contact facts from the card", () => {
    expect(site.brand).toMatchObject({ id: "aquafix", domain: "aquafix.top", businessType: "Plumber" });
    expect(site.brand.phone).toMatch(/^\+33/);
  });
});
