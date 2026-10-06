import { expect, test, type Browser, type Page } from "@playwright/test";
import { POSTHOG_HOST } from "./env";

// The QA menu (kitstart's `AbSwitcher`, docs/EXPERIMENTS.md "Forcing a
// variant"). The build under test is production, so the chip shows only to a
// visit the force parameter marked with `ab__qa`. Like experiments.spec.ts,
// every test starts as a new visitor, with no cookie.
test.use({ storageState: { cookies: [], origins: [] } });

const CHIP = { name: "A/B test switcher" } as const;

/**
 * Resolves once the current page's effects have run: the experiment beacon's
 * first exposure since the last navigation of the main frame.
 */
async function hydration(page: Page): Promise<() => Promise<void>> {
  let exposures = 0;
  page.on("framenavigated", frame => {
    if (frame === page.mainFrame()) exposures = 0;
  });
  await page.route(`${POSTHOG_HOST}/**`, async route => {
    if (route.request().postData()?.includes("experiment_exposed")) exposures += 1;
    await route.fulfill({ status: 200, body: "{}" });
  });
  return () => expect.poll(() => exposures).toBeGreaterThan(0);
}

/** The URL of the script that draws the menu, found by the marker in its body. */
async function panelChunk(browser: Browser): Promise<string> {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  const scripts: Promise<string | null>[] = [];
  page.on("response", res => {
    if (res.request().resourceType() !== "script") return;
    scripts.push(res.text().then(body => (body.includes("data-ab-switcher") ? res.url() : null), () => null));
  });
  await page.goto("/fr?ab_lead_form=b");
  await expect(page.getByRole("button", CHIP)).toBeVisible();
  const found = (await Promise.all(scripts)).filter(url => url !== null);
  await context.close();
  expect(found).toHaveLength(1);
  const [url] = found;
  if (url === undefined) throw new Error("no script carries the menu");
  return url;
}

test("a forced visit gets the chip, clear of the call bar", async ({ page }, testInfo) => {
  await page.goto("/fr?ab_lead_form=b");
  const chip = page.getByRole("button", CHIP);
  await expect(chip).toBeVisible();
  if (testInfo.project.name !== "mobile") return;
  // On a phone the call bar is pinned to the bottom; the chip must sit above it.
  const [chipBox, barBox] = await Promise.all([chip.boundingBox(), page.locator("#callbar").boundingBox()]);
  if (!chipBox || !barBox) throw new Error("the chip or the call bar has no box");
  expect(chipBox.y + chipBox.height).toBeLessThanOrEqual(barBox.y);
});

test("a new visitor gets no chip and never downloads the menu", async ({ page, browser }) => {
  const chunk = await panelChunk(browser);
  const requested: string[] = [];
  page.on("request", req => requested.push(req.url()));
  const ready = await hydration(page);
  await page.goto("/fr");
  await ready();
  await expect(page.getByRole("button", CHIP)).toHaveCount(0);
  expect(requested).not.toContain(chunk);
});

test("picking a variant in the menu switches the form", async ({ page }) => {
  await page.goto("/fr?ab_lead_form=a");
  await page.getByRole("button", CHIP).click();
  const menu = page.getByRole("dialog", CHIP);
  await expect(menu).toBeVisible();
  await menu.getByRole("group", { name: "Lead form" }).getByRole("button", { name: "Urgent first" }).click();
  await expect(page).toHaveURL(/[?&]ab_lead_form=c(&|$)/);
  await expect(page.locator("form#quote-form").getByText("C’est pour quand ?")).toBeVisible();
  // The menu reads the new assignment off the cookie.
  await page.getByRole("button", CHIP).click();
  await expect(menu.getByRole("button", { name: "Urgent first" })).toHaveAttribute("aria-pressed", "true");
});

/** The `Cookie` header of the next page load: what the browser kept after the menu's reset. */
async function nextLoadCookies(page: Page, act: () => Promise<void>): Promise<string> {
  const load = page.waitForRequest(req => req.isNavigationRequest() && req.frame() === page.mainFrame());
  await act();
  return (await (await load).allHeaders())["cookie"] ?? "";
}

const names = (header: string) => header.split(";").map(pair => pair.split("=")[0]?.trim());

// The proxy draws a new variant on the reload and sets its cookie again, so
// "dropped" is read off the reload's request, not off the jar after it.
test("Reset draws the variants again and keeps the visit a test", async ({ page, context }) => {
  await page.goto("/fr?ab_lead_form=b");
  await page.getByRole("button", CHIP).click();
  const sent = await nextLoadCookies(page, () => page.getByRole("dialog", CHIP).getByRole("button", { name: "Reset" }).click());
  expect(names(sent)).not.toContain("ab_lead_form");
  expect(names(sent)).toContain("ab__qa");
  await expect(page).not.toHaveURL(/ab_lead_form=/);
  await expect(page.getByRole("button", CHIP)).toBeVisible();
  expect((await context.cookies()).map(c => c.name)).toContain("ab__qa");
});

test("Leave test drops the QA mark and the chip", async ({ page, context }) => {
  const ready = await hydration(page);
  await page.goto("/fr?ab_lead_form=b");
  await page.getByRole("button", CHIP).click();
  const sent = await nextLoadCookies(page, () => page.getByRole("dialog", CHIP).getByRole("button", { name: "Leave test" }).click());
  expect(names(sent)).not.toContain("ab__qa");
  await expect(page).not.toHaveURL(/ab_lead_form=/);
  await ready();
  await expect(page.getByRole("button", CHIP)).toHaveCount(0);
  expect((await context.cookies()).map(c => c.name)).not.toContain("ab__qa");
});

// A browser QA marked under the old name (`ab_forced`, read until 2026-11-05):
// the proxy moves the mark on the first request, before the page's scripts
// run, so the chip shows on that very load — no second visit needed.
test("a browser with the legacy QA mark keeps it under the new name, chip included", async ({ page, context }) => {
  await context.addCookies([{ name: "ab_forced", value: "1", url: "http://royat.localhost" }]);
  await page.goto("/fr");
  await expect(page.getByRole("button", CHIP)).toBeVisible();
  const jar = await context.cookies();
  expect(jar.find(c => c.name === "ab__qa")?.value).toBe("1");
  expect(jar.map(c => c.name)).not.toContain("ab_forced");
});
