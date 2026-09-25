import { expect, test } from "@playwright/test";
import { APEX_ORIGIN } from "./env";

// Between the two designed widths the page is interpolation, and the bugs
// live there: a row that fits at 1440 and a column that fits at 390 can both
// overflow at 768. These are the widths a visitor actually brings — the
// narrowest phone still sold (320), a phone, a tablet upright and on its side,
// a laptop — with the height each has.
const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 900 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
] as const;

const POINT_PAGES = ["/fr", "/fr/prices", "/fr/about", "/fr/guarantee"] as const;
const PAGES = [...POINT_PAGES, `${APEX_ORIGIN}/fr`] as const;

// One sweep over every width, not one test per width: the viewport is set in
// the test, so this runs in one project only.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "sweeps its own viewports");
});

for (const url of PAGES) {
  test(`no horizontal scroll: ${url}`, async ({ page }) => {
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto(url);
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect.soft(overflow, `${url} at ${viewport.width}`).toBeLessThanOrEqual(0);
      // A word wider than its column overflows the heading without scrolling
      // the page when an ancestor clips it: the page check alone misses it.
      const h1 = await page.locator("h1").evaluate(el => el.scrollWidth - el.clientWidth);
      expect.soft(h1, `${url} h1 at ${viewport.width}`).toBeLessThanOrEqual(0);
    }
  });
}

// The page exists to be phoned from: at every width some `tel:` link is on
// the first screen without a scroll — the hero's, the header's or the call bar's.
for (const url of POINT_PAGES) {
  test(`a tel: link on the first screen: ${url}`, async ({ page }) => {
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto(url);
      await page.evaluate(() => document.fonts.ready);
      const onScreen = await page.locator('a[href^="tel:"]').evaluateAll((links, height) =>
        links.some(link => {
          const box = link.getBoundingClientRect();
          const style = getComputedStyle(link);
          return box.width > 0 && box.height > 0 && box.top >= 0 && box.bottom <= height && style.visibility !== "hidden";
        }),
      viewport.height);
      expect.soft(onScreen, `${url} at ${viewport.width}×${viewport.height}`).toBe(true);
    }
  });
}
