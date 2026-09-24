import { expect, test } from "@playwright/test";
import { APEX_ORIGIN, POINT_ORIGIN } from "./env";

// A 404 is still a page a visitor in an emergency lands on — from an old
// link, a typo, a point that moved. It must answer, in its language, with the
// phone, before any JavaScript: the same floor as the quote form. Next renders
// a `notFound()` boundary only after hydration, so these are the paths the
// proxy sends to the global not-found page instead.
test.describe("the 404 without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  const cases = [
    { name: "an unknown point, through the apex", url: `${APEX_ORIGIN}/fr/nowhere`, lang: "fr", home: "/fr" },
    { name: "a dead page on a point's subdomain", url: `${POINT_ORIGIN}/fr/nope`, lang: "fr", home: "/fr" },
    { name: "a dead page of a point, through the apex", url: `${APEX_ORIGIN}/en/lyon-nord/nope`, lang: "en", home: "/en/lyon-nord" },
    // Unprefixed junk, in the browser's language (the config's fr-FR) —
    // each once reached `[locale]` and was cached as a page.
    { name: "an unprefixed path", url: `${APEX_ORIGIN}/nope/nope`, lang: "fr", home: "/fr" },
    { name: "a scanner's probe", url: `${APEX_ORIGIN}/wp-login.php`, lang: "fr", home: "/fr" },
    { name: "a prefixed path with an extension", url: `${POINT_ORIGIN}/fr/x.php`, lang: "fr", home: "/fr" },
  ];

  for (const { name, url, lang, home } of cases) {
    test(`${name} is a 404 with the brand's screen and the phone`, async ({ page }) => {
      const response = await page.goto(url);
      expect(response?.status()).toBe(404);
      // Rendered per request: nothing a scanner asks for takes a cache entry.
      const headers = response?.headers() ?? {};
      expect(headers["cache-control"]).toMatch(/no-store/);
      expect(headers["x-nextjs-cache"]).toBeUndefined();
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.locator("html")).toHaveAttribute("data-brand", "aquafix");
      await expect(page.getByText("404", { exact: true }).first()).toBeVisible();
      await expect(page.locator("a[href^='tel:+33']").first()).toBeVisible();
      // Home is the point's own, in the mode the visitor came through.
      await expect(page.locator(`a[href="${home}"]`).first()).toBeVisible();
      await expect(page.locator("meta[name=robots]")).toHaveAttribute("content", /noindex/);
    });
  }
});
