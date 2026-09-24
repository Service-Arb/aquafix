import { expect, test } from "@playwright/test";

// A point's pages are cached (ISR): nothing on them may read the request, or
// every visit would render again. The first request fills the cache (or finds
// it filled by another spec); the second must come from it.
test("a point's page is served from the cache on the second request", async ({ request }) => {
  const first = await request.get("/fr/guarantee");
  expect(first.status()).toBe(200);
  const second = await request.get("/fr/guarantee");
  expect(second.status()).toBe(200);
  expect(second.headers()["x-nextjs-cache"]).toBe("HIT");
});
