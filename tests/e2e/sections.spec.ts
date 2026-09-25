import { expect, test, type Page } from "@playwright/test";
import { APEX_ORIGIN } from "./env";

// One visual baseline per section, at both designed breakpoints. Adding a
// section to the site is adding one line here; nothing else changes.
//
// Every section is reached by its own URL, never by scrolling to it: a scroll
// is a moving target the runner has to guess is over, and it never agrees with
// the page about when that is. A `#` the site itself links to is a fixed one.
// The pages are the Royat point's, on its own host; the brand page is the apex.
const SECTIONS = [
  { name: "header", url: "/fr", selector: "header" },
  { name: "hero", url: "/fr", selector: "main > section >> nth=0" },
  { name: "stats", url: "/fr#stats", selector: "#stats" },
  { name: "work", url: "/fr#work", selector: "#work" },
  { name: "prices", url: "/fr#prices", selector: "#prices" },
  { name: "guarantee", url: "/fr#guarantee", selector: "#guarantee" },
  { name: "reviews", url: "/fr#reviews", selector: "#reviews" },
  { name: "coverage", url: "/fr#areas", selector: "#areas" },
  { name: "footer", url: "/fr#footer", selector: "footer" },
  { name: "callbar", url: "/fr", selector: "#callbar" },
  { name: "faq", url: "/fr/prices#faq", selector: "#faq" },
  { name: "crew", url: "/fr/about#crew", selector: "#crew" },
  { name: "areas", url: "/fr/about#areas", selector: "#areas" },
  { name: "points", url: `${APEX_ORIGIN}/fr#points`, selector: "#points" },
  // The status screens, whole: kitstart's screen under the brand's frame. The
  // 404 is the proxy's, rendered on the server; the thank-you page is where
  // the form's 303 lands.
  { name: "status-404", url: "/fr/nope", selector: "main >> xpath=.." },
  { name: "thanks", url: "/fr/thanks", selector: "main >> xpath=.." },
] as const;

// `md:hidden` in the design: at 1440 there is nothing to shoot.
const MOBILE_ONLY = new Set<string>(["callbar"]);

// The site scrolls smoothly for everyone who has not asked it not to, and an
// animated scroll is exactly the moving target above. `use.reducedMotion` does
// not reach the page in 1.60; `emulateMedia` does.
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

async function settle(page: Page, selector: string): Promise<void> {
  // Web fonts shift glyph metrics; a shot taken before they apply is a
  // baseline of the fallback face.
  await page.evaluate(() => document.fonts.ready);
  // A lazy image below the fold of a tall section never starts on its own;
  // shot half-loaded it is a baseline of a grey box.
  await page.locator(selector).evaluate(root =>
    Promise.all(
      Array.from(root.querySelectorAll("img"), img => {
        img.loading = "eager";
        if (img.complete) return null;
        return new Promise(done => {
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        });
      }),
    ),
  );
  await page.waitForLoadState("networkidle");
  // Opacity reaching 1 is not the same as the motion being over: `animations:
  // "disabled"` freezes CSS animations, not ones driven through the Web
  // Animations API. Waiting for the document to have nothing pending is exact;
  // looping decoration would never finish, so only finite animations count.
  await page.waitForFunction(
    () =>
      document
        .getAnimations()
        .filter(a => (a.effect?.getComputedTiming().iterations ?? 1) !== Infinity)
        .every(a => a.playState === "finished" || a.playState === "idle"),
    undefined,
    { timeout: 10_000 },
  );
}

for (const { name, url, selector } of SECTIONS) {
  test(`section: ${name}`, async ({ page }, testInfo) => {
    test.skip(MOBILE_ONLY.has(name) && testInfo.project.name !== "mobile");
    await page.goto(url);
    const section = page.locator(selector);
    await expect(section).toBeVisible();
    await settle(page, selector);
    // The call bar rides the viewport, so it is inside the crop of every
    // section taller than one screen; the section stylesheet takes it out, and
    // it is shot here on its own instead.
    await expect(section).toHaveScreenshot(
      `${name}-${testInfo.project.name}.png`,
      name === "callbar" ? { stylePath: [] } : {},
    );
  });
}

// The quote form's job list, open. It is portalled out of the hero, so no
// section crop holds it: the shot is the form card and the list together,
// the first item under the keyboard's highlight.
test("section: hero job list", async ({ page }, testInfo) => {
  await page.goto("/fr#quote");
  const form = page.locator("form#quote");
  const trigger = form.locator("button[role=combobox]");
  await expect(trigger).toBeVisible();
  await settle(page, "form#quote");
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  const list = page.getByRole("listbox");
  await expect(list).toBeVisible();
  await settle(page, "form#quote");
  const [a, b] = await Promise.all([form.boundingBox(), list.boundingBox()]);
  if (!a || !b) throw new Error("the form or its list has no box");
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const clip = {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
  await expect(page).toHaveScreenshot(`hero-job-list-${testInfo.project.name}.png`, { clip });
});
