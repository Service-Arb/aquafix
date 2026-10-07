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
  // lead_channel at its control: any other arm draws the compact card whatever lead_form says.
  await page.goto("/fr?ab_lead_form=a&ab_lead_channel=a");
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

test("the menu offers every lead_channel board and forces the one picked", async ({ page }) => {
  await page.goto("/fr?ab_lead_form=a&ab_lead_channel=a");
  await page.getByRole("button", CHIP).click();
  const group = page.getByRole("dialog", CHIP).getByRole("group", { name: "Lead channel" });
  await expect(group.getByRole("button")).toHaveText(["Control", "AQ-1 select", "AQ-2 segment", "AQ-3 thanks", "AQ-4 swap", "AQ-5 saga", "AQ-6 urgency"]);
  await group.getByRole("button", { name: "AQ-4 swap" }).click();
  await expect(page).toHaveURL(/[?&]ab_lead_channel=e(&|$)/);
  // This server's Royat offers no messenger: the arm is assigned but inert, the card lead_form's.
  await expect(page.locator("#quote")).toHaveAttribute("data-experiment", "lead_form");
  await page.getByRole("button", CHIP).click();
  await expect(group.getByRole("button", { name: "AQ-4 swap" })).toHaveAttribute("aria-pressed", "true");
});

/**
 * The request headers of the next page load: its `Cookie` (what the browser
 * kept after the menu's reset) and its `Sec-Fetch-Site`, which the proxy reads
 * to tell a move inside the site from a visit from outside. Under a
 * `page.route` (`hydration`) Playwright does not report `Sec-Fetch-Site`,
 * though the browser sends it: read `from` only in a test without one.
 */
async function nextLoad(page: Page, act: () => Promise<void>): Promise<{ cookie: string; from: string | undefined }> {
  const load = page.waitForRequest(req => req.isNavigationRequest() && req.frame() === page.mainFrame());
  await act();
  const headers = await (await load).allHeaders();
  return { cookie: headers["cookie"] ?? "", from: headers["sec-fetch-site"] };
}

const names = (header: string) => header.split(";").map(pair => pair.split("=")[0]?.trim());

/** A browser's own draw, as the proxy would have left it: set before the first forced visit. */
const own = (variants: { hero_call_first: string; lead_form: string; lead_channel: string }) =>
  Object.entries(variants).map(([id, value]) => ({ name: `ab_${id}`, value, url: "http://royat.localhost" }));

// Reset drops the assignments and the force parameters but keeps `ab__qa`, so
// the reload is the home without a force and without a running test's cookie,
// from inside the site: the proxy reads it as the tap, gives back the variants
// the mark saved and drops it. "Dropped" is read off the reload's request, the
// variants given back off the jar after it.
test("Reset leaves the test with the visitor's own variants, and the chip goes", async ({ page, context }) => {
  await context.addCookies(own({ hero_call_first: "a", lead_form: "c", lead_channel: "a" }));
  const ready = await hydration(page);
  await page.goto("/fr?ab_lead_form=b");
  await expect(page.locator("#quote")).toHaveAttribute("data-variant", "b");
  await page.getByRole("button", CHIP).click();
  const sent = await nextLoad(page, () => page.getByRole("dialog", CHIP).getByRole("button", { name: "Reset" }).click());
  expect(names(sent.cookie)).not.toContain("ab_lead_form");
  expect(names(sent.cookie)).toContain("ab__qa");
  await expect(page).not.toHaveURL(/ab_lead_form=/);
  await ready();
  await expect(page.getByRole("button", CHIP)).toHaveCount(0);
  await expect(page.locator("#quote")).toHaveAttribute("data-variant", "c");
  const jar = await context.cookies();
  expect(jar.find(c => c.name === "ab_lead_form")?.value).toBe("c");
  expect(jar.map(c => c.name)).not.toContain("ab__qa");
});

// The URL is the whole QA state: a test the query no longer names is back at
// the visitor's own variant, not left at the earlier force.
test("forcing another test gives the first one back the visitor's own variant", async ({ page, context }) => {
  await context.addCookies(own({ hero_call_first: "a", lead_form: "a", lead_channel: "a" }));
  await page.goto("/fr?ab_lead_form=c");
  await expect(page.locator("#quote")).toHaveAttribute("data-variant", "c");
  await page.goto("/fr?ab_hero_call_first=b");
  await expect(page.locator("#quote")).toHaveAttribute("data-variant", "a");
  await page.getByRole("button", CHIP).click();
  const menu = page.getByRole("dialog", CHIP);
  await expect(menu.getByRole("group", { name: "Lead form" }).getByRole("button", { name: "Compact" })).toHaveAttribute("aria-pressed", "true");
  await expect(menu.getByRole("group", { name: "Mobile hero" }).getByRole("button", { name: "Call first" })).toHaveAttribute("aria-pressed", "true");
  expect((await context.cookies()).find(c => c.name === "ab_lead_form")?.value).toBe("a");
});

// QA survives a move inside the site (`Sec-Fetch-Site: same-origin`): the
// logo and the language switch lead to the home without the query, and the
// forced variant, the mark and the chip stay.
test("the logo and the language switch keep a forced visit in QA", async ({ page, context }) => {
  await context.addCookies(own({ hero_call_first: "a", lead_form: "a", lead_channel: "a" }));
  await page.goto("/fr?ab_lead_form=c");
  await expect(page.locator("#quote")).toHaveAttribute("data-variant", "c");

  const logo = await nextLoad(page, () => page.getByRole("link", { name: "Aquafix Royat" }).click());
  expect(logo.from).toBe("same-origin");
  await expect(page).toHaveURL(/\/fr$/);
  await expect(page.locator("#quote")).toHaveAttribute("data-variant", "c");
  await expect(page.getByRole("button", CHIP)).toBeVisible();

  const english = await nextLoad(page, () => page.getByRole("link", { name: "English" }).first().click());
  expect(english.from).toBe("same-origin");
  await expect(page).toHaveURL(/\/en(\?|$)/);
  await expect(page.locator("#quote")).toHaveAttribute("data-variant", "c");
  await expect(page.getByRole("button", CHIP)).toBeVisible();
  expect((await context.cookies()).find(c => c.name === "ab_lead_form")?.value).toBe("c");
});

// Typing the home in the address bar is a visit from outside
// (`Sec-Fetch-Site: none`): QA ends with the visitor's own variants.
test("opening the home from the address bar after a force leaves the test", async ({ page, context }) => {
  await context.addCookies(own({ hero_call_first: "a", lead_form: "a", lead_channel: "a" }));
  const ready = await hydration(page);
  await page.goto("/fr?ab_lead_form=c");
  await expect(page.getByRole("button", CHIP)).toBeVisible();
  await page.goto("/fr");
  await ready();
  await expect(page.locator("#quote")).toHaveAttribute("data-variant", "a");
  await expect(page.getByRole("button", CHIP)).toHaveCount(0);
  expect((await context.cookies()).map(c => c.name)).not.toContain("ab__qa");
});

test("Leave test drops the QA mark and the chip", async ({ page, context }) => {
  const ready = await hydration(page);
  await page.goto("/fr?ab_lead_form=b");
  await page.getByRole("button", CHIP).click();
  const sent = await nextLoad(page, () => page.getByRole("dialog", CHIP).getByRole("button", { name: "Leave test" }).click());
  expect(names(sent.cookie)).not.toContain("ab__qa");
  await expect(page).not.toHaveURL(/ab_lead_form=/);
  await ready();
  await expect(page.getByRole("button", CHIP)).toHaveCount(0);
  expect((await context.cookies()).map(c => c.name)).not.toContain("ab__qa");
});

// A browser QA marked under the old name (`ab_forced`, read until 2026-11-05):
// the proxy drops it on the first request and no longer moves it to `ab__qa` —
// it holds no snapshot, and a visit without a force leaves QA anyway.
test("a browser with the legacy QA mark loses it and is not marked anew", async ({ page, context }) => {
  await context.addCookies([{ name: "ab_forced", value: "1", url: "http://royat.localhost" }]);
  const ready = await hydration(page);
  await page.goto("/fr");
  await ready();
  await expect(page.getByRole("button", CHIP)).toHaveCount(0);
  const jar = (await context.cookies()).map(c => c.name);
  expect(jar).not.toContain("ab_forced");
  expect(jar).not.toContain("ab__qa");
});
