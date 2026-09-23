import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copyFor } from "@/entities/content";
import { LOCATIONS } from "@/entities/location";
import { brandMetadata, locationGraph, locationMetadata, statusMetadata } from "@/features/seo";
import { BRAND } from "@/shared/config/brand";
import { LOCALES } from "@/shared/config/i18n";
import { PAGE_KEYS } from "@/shared/config/routes";
import { context, publishedRoyat, royat } from "./support/fixtures";

/**
 * What a crawler reads, pinned byte for byte. The refactors that move these
 * builders behind a site config and a package must leave every file here
 * untouched; a change to one is a change to the index, and says so in review.
 *
 * Regenerate deliberately with `npx vitest run tests/golden.test.ts -u`.
 */
const NOW = new Date("2026-09-23T12:00:00Z");
const GOLDEN = (name: string) => `./golden/${name}.json`;

/** Through JSON, as a crawler reads it; stable key order is the builders'. */
const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

const PUBLISHED = publishedRoyat({
  geo: { lat: 45.7667, lng: 3.0514 },
  rating: { value: 4.7, count: 31, fetchedAt: "2026-09-20T00:00:00Z" },
});

describe("golden: JSON-LD", () => {
  it("every page of an unpublished and a published point, in both languages", async () => {
    const out: Record<string, unknown> = {};
    for (const [name, location] of [["royat", royat()], ["royat-published", PUBLISHED]] as const) {
      for (const locale of LOCALES) {
        const { point, copy } = context(location, locale);
        for (const page of PAGE_KEYS) out[`${name}/${locale}/${page}`] = locationGraph(point, copy, page, NOW);
      }
    }
    await expect(json(out)).toMatchFileSnapshot(GOLDEN("ld-royat"));
  });

  it("the home page of every baked point", async () => {
    const out: Record<string, unknown> = {};
    for (const location of LOCATIONS) {
      const { point, copy } = context(location, "fr");
      out[location.slug] = locationGraph(point, copy, "home", NOW);
    }
    await expect(json(out)).toMatchFileSnapshot(GOLDEN("ld-points"));
  });
});

describe("golden: <head> metadata", () => {
  it("every page of a point, the brand page and a status page", async () => {
    const out: Record<string, unknown> = {};
    for (const [name, location] of [["royat", royat()], ["royat-published", PUBLISHED]] as const) {
      for (const locale of LOCALES) {
        const { point, copy } = context(location, locale);
        for (const page of PAGE_KEYS) out[`${name}/${locale}/${page}`] = locationMetadata(point, copy, page);
      }
    }
    for (const locale of LOCALES) {
      const copy = copyFor({ locale, place: BRAND.name, phone: BRAND.phone });
      out[`brand/${locale}`] = brandMetadata(copy);
      out[`status/${locale}`] = statusMetadata(copy.t.thanks.title);
    }
    // A point reached through the apex path still names its subdomain.
    const apex = context(royat(), "fr");
    out["royat/fr/home (path mode)"] = locationMetadata({ ...apex.point, mode: "path" }, apex.copy, "home");
    await expect(json(out)).toMatchFileSnapshot(GOLDEN("metadata"));
  });
});

describe("golden: sitemap and robots", () => {
  let host = "";
  beforeEach(() => {
    vi.resetModules();
    vi.doMock("next/headers", () => ({ headers: async () => new Headers({ host }) }));
  });
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const render = async (h: string) => {
    host = h;
    const sitemap = (await import("../app/sitemap")).default;
    const robots = (await import("../app/robots")).default;
    return { sitemap: await sitemap(), robots: await robots() };
  };

  it("per host, baked and with a live source that publishes one point", async () => {
    const out: Record<string, unknown> = {};
    for (const h of ["aquafix.top", "royat.aquafix.top", "evil.aquafix.top", "royat.localhost:3000"]) {
      out[`baked ${h}`] = await render(h);
    }
    vi.stubEnv("LOCATIONS_API_URL", "https://live.example");
    const { storefrontPhoto, landmark, serviceArea, hours } = PUBLISHED;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) =>
        /\/locations\/royat\?/.test(String(input))
          ? Response.json({ storefrontPhoto, landmark, serviceArea, hours })
          : Response.json({}),
      ),
    );
    vi.resetModules();
    for (const h of ["royat.aquafix.top", "lyon-nord.aquafix.top"]) out[`live ${h}`] = await render(h);
    await expect(json(out)).toMatchFileSnapshot(GOLDEN("sitemap-robots"));
  });
});
