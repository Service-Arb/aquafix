import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseLive, storefrontOf } from "@/entities/place";

describe("the live location source", () => {
  it("keeps what validates and drops what does not", () => {
    const live = parseLive({
      phone: "+33 4 00 00 00 00",
      whatsapp: "06 12 34 56 78", // national: cannot become wa.me, dropped
      storefrontPhoto: "http://insecure.example/x.jpg", // not https, dropped
      hours: [{ days: ["Monday"], opens: "07:00", closes: "21:00" }],
      serviceArea: ["Royat", 3, "Ceyrat"],
      rating: { value: 9, count: 1, fetchedAt: "2026-09-20" }, // out of range, dropped
      address: { street: "1 Rue X", postalCode: "6313", locality: "Royat" }, // bad CP, dropped
    });
    expect(live).toEqual({
      phone: "+33 4 00 00 00 00",
      hours: [{ days: ["Monday"], opens: "07:00", closes: "21:00" }],
      serviceArea: [{ kind: "localities", names: ["Royat", "Ceyrat"] }],
    });
  });

  describe("getPlace", () => {
    beforeEach(() => {
      vi.stubEnv("LOCATIONS_API_URL", "https://live.example");
      vi.resetModules();
    });
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
    });

    const load = async () => (await import("@/entities/place/server")).getPlace;

    it("merges live fields over the baked ones", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => Response.json({ phone: "+33 4 11 11 11 11", serviceArea: ["Royat"] })));
      const location = await (await load())("royat", "fr");
      expect(location?.channels.phone).toBe("+33 4 11 11 11 11");
      expect(location?.serviceArea).toEqual([{ kind: "localities", names: ["Royat"] }]);
      expect(location && storefrontOf(location)?.address.postalCode).toBe("63130");
    });

    it("turns a 404 into a missing point", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
      expect(await (await load())("royat", "fr")).toBeNull();
    });

    it("throws on a 5xx, so the page is a 500 and not a soft 404", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 502 })));
      await expect((await load())("royat", "fr")).rejects.toThrow(/502/);
    });

    it("serves the baked point when the source is unreachable", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const location = await (await load())("royat", "fr");
      expect(location?.slug).toBe("royat");
      expect(location?.hours).toBeNull();
    });

    it("never asks the source about a point it does not have", async () => {
      const fetch = vi.fn();
      vi.stubGlobal("fetch", fetch);
      expect(await (await load())("paris", "fr")).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });

    const list = async () => (await import("@/entities/place/server")).listPlaces;
    const bySlug = (answer: (slug: string) => Response | Promise<Response>) =>
      vi.fn(async (input: string | URL | Request) => {
        const slug = /\/locations\/([^?]+)/.exec(String(input))?.[1] ?? "";
        return answer(slug);
      });

    it("keeps the sitemap strict on a dead or failing source", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
      await expect((await list())("fr", "sitemap")).rejects.toThrow(/unreachable/);
      vi.stubGlobal("fetch", bySlug(s => new Response(null, { status: s === "royat" ? 503 : 200 })));
      await expect((await list())("fr", "sitemap")).rejects.toThrow(/503/);
    });

    it("lets the brand page stand on the baked points when the source is dead", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
      expect(await (await list())("fr", "page")).toHaveLength(6);
      vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 500 })));
      expect(await (await list())("fr", "page")).toHaveLength(6);
    });

    it("drops a point the source retired (404) in both modes", async () => {
      vi.stubGlobal("fetch", bySlug(s => (s === "royat" ? new Response(null, { status: 404 }) : Response.json({}))));
      for (const mode of ["page", "sitemap"] as const) {
        const slugs = (await (await list())("fr", mode)).map(l => l.slug);
        expect(slugs).toHaveLength(5);
        expect(slugs).not.toContain("royat");
      }
    });
  });
});
