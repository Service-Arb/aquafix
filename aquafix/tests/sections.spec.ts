import { expect, test } from "@playwright/test";

// One visual baseline per section, at both designed breakpoints. Adding a
// section to the site is adding one line here; nothing else changes.
//
// This layer owns layout, spacing and responsive behaviour. Structure and class
// drift belong to the insta snapshots (tests/sections.rs), which are two orders
// of magnitude cheaper — if a failure could be caught there, fix it there.
const SECTIONS = [
  { name: "header", path: "/", selector: "header" },
  { name: "hero", path: "/", selector: "#quote" },
  { name: "prices", path: "/", selector: "#prices" },
  { name: "guarantee", path: "/", selector: "#guarantee" },
  { name: "reviews", path: "/", selector: "#reviews" },
  { name: "footer", path: "/", selector: "footer" },
  { name: "faq", path: "/prices", selector: "#faq" },
  { name: "crew", path: "/about", selector: "#crew" },
  { name: "areas", path: "/about", selector: "#areas" },
] as const;

// The chrome has no anchor of its own and reads differently once scrolled.
const PIN_TO_TOP = new Set<string>(["header", "hero"]);

for (const { name, path, selector } of SECTIONS) {
  test(`- mismatch on: ${name}`, async ({ page }, testInfo) => {
    await page.goto(path);

    // Web fonts shift glyph metrics; a shot taken before they apply is a
    // baseline of the fallback face.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");

    const section = page.locator(selector);
    await expect(section).toBeVisible();

    if (PIN_TO_TOP.has(name)) {
      await page.evaluate(() => window.scrollTo(0, 0));
    } else {
      await section.scrollIntoViewIfNeeded();
    }

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
test("- quote form submits with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");

  await page.locator("#quote select[name=job]").selectOption("blocked_drain");
  await page.locator("#quote input[name=zip]").fill("97210");
  await page.locator("#quote input[name=mobile]").fill("5035550148");
  await Promise.all([page.waitForURL("**/thanks"), page.locator("#quote button[type=submit]").click()]);

  await expect(page.locator("text=REQUEST RECEIVED")).toBeVisible();
  await context.close();
});
