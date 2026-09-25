import { expect, test, type Page } from "@playwright/test";

// The headers' menu: the home page's between `md` and `lg`, the sub-pages'
// below `lg`. One component, so each case runs on both.
const CASES = [
  { url: "/fr", viewport: { width: 768, height: 900 } },
  { url: "/fr/prices", viewport: { width: 390, height: 844 } },
] as const;

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "sets its own viewports");
});

async function open(page: Page) {
  const details = page.locator("header details");
  await details.locator("summary").click();
  await expect(details).toHaveAttribute("open", "");
  await expect(details.locator(":scope > nav")).toBeVisible();
  return details;
}

for (const { url, viewport } of CASES) {
  test(`the menu closes on Escape and on a press outside: ${url}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(url);
    // Hydrated: the dismiss listeners are attached with the page's islands.
    await page.waitForLoadState("networkidle");

    const details = await open(page);
    await page.keyboard.press("Escape");
    await expect(details).not.toHaveAttribute("open");
    await expect(details.locator("summary")).toBeFocused();

    await open(page);
    // Below the panel, which covers the top of the page while open.
    await page.mouse.click(viewport.width / 2, viewport.height - 10);
    await expect(details).not.toHaveAttribute("open");
    // …and not because the press followed a link off the page.
    expect(new URL(page.url()).pathname).toBe(url);

    // A press inside is a press on the menu, not a dismissal.
    await open(page);
    await details.locator(":scope > nav").click({ position: { x: 5, y: 5 } });
    await expect(details).toHaveAttribute("open", "");

    // An Escape something else already handled is not the menu's.
    await page.evaluate(() => {
      document.addEventListener("keydown", e => e.preventDefault(), { capture: true, once: true });
    });
    await page.keyboard.press("Escape");
    await expect(details).toHaveAttribute("open", "");
  });
}

// The work band's detail is a popover, in the top layer: Escape is its.
test("Escape closes an open popover, not the menu under it", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/fr");
  await page.waitForLoadState("networkidle");
  const details = await open(page);
  // Shown by script: a press on its tile would be a press outside the menu.
  await page.locator("[popover]").first().evaluate(el => {
    if (el instanceof HTMLElement) el.showPopover();
  });
  await page.keyboard.press("Escape");
  await expect(page.locator("[popover]").first()).toBeHidden();
  await expect(details).toHaveAttribute("open", "");
});

// "Avis" on the home page is `#reviews` on the same page: the page scrolls
// and stays, so without this the menu stayed open over the reviews.
test("following a link in the menu closes it", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/fr");
  await page.waitForLoadState("networkidle");
  const details = await open(page);
  await details.locator(':scope > nav a[href$="#reviews"]').click();
  await expect(page).toHaveURL(/#reviews$/);
  await expect(details).not.toHaveAttribute("open");
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const { url, viewport } of CASES) {
    test(`the menu is the platform's disclosure: ${url}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(url);
      const details = await open(page);
      await details.locator("summary").click();
      await expect(details).not.toHaveAttribute("open");
    });
  }
});
