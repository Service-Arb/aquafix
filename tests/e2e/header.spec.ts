import { expect, test, type Page } from "@playwright/test";

// The header's mechanics, shared with vifnet: sticky on every page, a menu on
// a phone, and a panel that is an overlay — opening it never moves the page.
// The regressions: the home header scrolled away and had no menu below `md`;
// the sub-pages' was not sticky; a menu in flow pushed the page down.
const PHONE = { width: 390, height: 844 } as const;
const PAGES = ["/fr", "/fr/prices"] as const;

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "sets its own viewports");
});

async function load(page: Page, url: string) {
  await page.setViewportSize(PHONE);
  // No smooth scroll: a position read mid-animation is not the page's.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url);
  // Hydrated: the surface and dismiss listeners are attached.
  await page.waitForLoadState("networkidle");
}

const headerTop = (page: Page) => page.locator("header").first().evaluate(el => el.getBoundingClientRect().top);

test("the home page has a menu on a phone", async ({ page }) => {
  await load(page, "/fr");
  await expect(page.locator("header details[data-nav-menu] > summary")).toBeVisible();
});

for (const url of PAGES) {
  for (const at of ["top", "middle"] as const) {
    test(`opening the menu does not move the page: ${url} at the ${at}`, async ({ page }) => {
      await load(page, url);
      if (at === "middle") {
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
      }
      const before = await page.evaluate(() => ({
        y: window.scrollY,
        main: document.querySelector("main")?.getBoundingClientRect().top,
      }));
      expect(before.y > 0, "scrolled before opening").toBe(at === "middle");
      const details = page.locator("header details[data-nav-menu]");
      // A press where the burger is, as a finger does. Playwright's own click
      // first scrolls its target into view, and Chrome scrolls to a sticky
      // header's static place in flow — a move no visitor makes.
      const box = await details.locator("summary").boundingBox();
      if (!box) throw new Error("the burger is not laid out");
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await expect(details).toHaveAttribute("open", "");
      const after = await page.evaluate(() => ({
        y: window.scrollY,
        main: document.querySelector("main")?.getBoundingClientRect().top,
      }));
      expect(after).toEqual(before);
    });
  }

  test(`the header stays at the top once scrolled: ${url}`, async ({ page }) => {
    await load(page, url);
    await page.evaluate(() => window.scrollTo(0, 1500));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
    expect(await headerTop(page)).toBe(0);
    await expect(page.locator("header").first()).toBeInViewport();
  });
}

test("the home header turns solid once scrolled", async ({ page }) => {
  await load(page, "/fr");
  const header = page.locator("header").first();
  await expect(header).not.toHaveAttribute("data-scrolled");
  await expect(header).toHaveClass(/\bdark\b/);
  await page.evaluate(() => window.scrollTo(0, 400));
  await expect(header).toHaveAttribute("data-scrolled", "");
  await expect(header).toHaveClass(/\blight\b/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(header).not.toHaveAttribute("data-scrolled");
  await expect(header).toHaveClass(/\bdark\b/);
});

test("an anchor lands below the bar, not under it", async ({ page }) => {
  await load(page, "/fr/prices");
  await page.locator("header details[data-nav-menu] > summary").click();
  await page.locator('header details[data-nav-menu] a[href$="#quote"]').click();
  await expect(page).toHaveURL(/\/fr#quote$/);
  await page.waitForLoadState("networkidle");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  const { bar, target } = await page.evaluate(() => ({
    bar: document.querySelector("header")?.getBoundingClientRect().bottom ?? Infinity,
    target: document.getElementById("quote")?.getBoundingClientRect().top ?? -Infinity,
  }));
  expect(target).toBeGreaterThanOrEqual(bar - 1);
});
