import { describe, expect, it, vi } from "vitest";
import { countsAsPageView } from "@/features/analytics/events";
import { memoByKey } from "@/shared/lib/memo";

describe("memoByKey (the OG card cache)", () => {
  it("computes each key once, concurrent first callers included", async () => {
    const draw = vi.fn(async (key: string) => `card:${key}`);
    const card = memoByKey(draw);
    expect(await Promise.all([card("royat|fr|home"), card("royat|fr|home"), card("|en|home")])).toEqual([
      "card:royat|fr|home",
      "card:royat|fr|home",
      "card:|en|home",
    ]);
    await card("royat|fr|home");
    expect(draw).toHaveBeenCalledTimes(2);
  });

  it("forgets a failure so the next request retries", async () => {
    let calls = 0;
    const card = memoByKey(async () => {
      calls += 1;
      if (calls === 1) throw new Error("font missing");
      return "ok";
    });
    await expect(card("k")).rejects.toThrow();
    expect(await card("k")).toBe("ok");
  });
});

describe("location_page_view", () => {
  it("is not counted on the thank-you page, in either link mode", () => {
    expect(countsAsPageView("/fr/thanks")).toBe(false);
    expect(countsAsPageView("/en/royat/thanks/")).toBe(false);
    expect(countsAsPageView("/fr")).toBe(true);
    expect(countsAsPageView("/fr/royat/prices")).toBe(true);
  });
});
