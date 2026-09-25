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
  });
}

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
