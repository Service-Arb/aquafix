import { expect, test } from "@playwright/test";

// One visual baseline per section, at both designed breakpoints. Adding a
// section to the site is adding one line here; nothing else changes.
//
// This layer owns layout, spacing and responsive behaviour. Structure and class
// drift belong to the insta snapshots (tests/sections.rs), which are two orders
// of magnitude cheaper — if a failure could be caught there, fix it there.
//
// Every section is reached by its own URL, never by scrolling to it: a scroll is
// a moving target the runner has to guess is over, and it never agrees with the
// page about when that is. A `#` the site itself links to is a fixed one.
const SECTIONS = [
  { name: "header", url: "/", selector: "header" },
  { name: "hero", url: "/#quote", selector: "#quote" },
  { name: "prices", url: "/#prices", selector: "#prices" },
  { name: "guarantee", url: "/#guarantee", selector: "#guarantee" },
  { name: "reviews", url: "/#reviews", selector: "#reviews" },
  { name: "footer", url: "/#footer", selector: "footer" },
  { name: "faq", url: "/prices#faq", selector: "#faq" },
  { name: "crew", url: "/about#crew", selector: "#crew" },
  { name: "areas", url: "/about#areas", selector: "#areas" },
] as const;

// The site scrolls smoothly for everyone who has not asked it not to, and an
// animated scroll is exactly the moving target above. `use.reducedMotion` does
// not reach the page in 1.60; `emulateMedia` does.
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

for (const { name, url, selector } of SECTIONS) {
  test(`- mismatch on: ${name}`, async ({ page }, testInfo) => {
    await page.goto(url);

    // Web fonts shift glyph metrics; a shot taken before they apply is a
    // baseline of the fallback face.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");

    const section = page.locator(selector);
    await expect(section).toBeVisible();

    // The gotcha inherited from site_conductor: opacity reaching 1 is not the
    // same as the motion being over. Playwright's `animations: "disabled"` only
    // freezes CSS animations; anything driven through the Web Animations API is
    // still running. Waiting for the document to have nothing pending is exact.
    // Looping decoration would never finish, so only non-infinite animations
    // count as "still settling".
    await page.waitForFunction(
      () =>
        document
          .getAnimations()
          .filter(a => (a.effect?.getComputedTiming().iterations ?? 1) !== Infinity)
          .every(a => a.playState === "finished" || a.playState === "idle"),
      undefined,
      { timeout: 10_000 }
    );

    await expect(section).toHaveScreenshot(`${name}-${testInfo.project.name}.png`);
  });
}

// The funnel's floor: the form must submit before any wasm has loaded. A
// regression here is invisible to every other test in the suite and costs
// exactly the visitors the page is designed for.
//
// `/#quote` is the link the header CTA and the mobile call bar point at, so the
// form is on screen on arrival and the click needs no scroll of its own.
test.describe(() => {
  test.use({ javaScriptEnabled: false });

  test("- quote form submits with JavaScript disabled", async ({ page }) => {
    await page.goto("/#quote");

    await page.locator("#quote select[name=job]").selectOption("blocked_drain");
    await page.locator("#quote input[name=zip]").fill("97210");
    await page.locator("#quote input[name=mobile]").fill("5035550148");
    await Promise.all([page.waitForURL("**/thanks"), page.locator("#quote button[type=submit]").click()]);

    await expect(page.locator("text=REQUEST RECEIVED")).toBeVisible();
  });
});
