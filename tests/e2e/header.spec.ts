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

const belowBar = (page: Page, id: string) =>
  page.evaluate(anchor => {
    const bar = document.querySelector("header")?.getBoundingClientRect().bottom ?? Infinity;
    const target = document.getElementById(anchor)?.getBoundingClientRect().top ?? -Infinity;
    return target - bar;
  }, id);

for (const viewport of [PHONE, { width: 1280, height: 800 }]) {
  test(`a sub-page's anchor lands below the bar at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/fr/prices#faq");
    await page.waitForLoadState("networkidle");
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    expect(await belowBar(page, "faq")).toBeGreaterThanOrEqual(-1);
  });
}

test("the sub-pages' bar is 100px from xl, and so is the anchor offset", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/fr/prices");
  const { height, padding } = await page.evaluate(() => ({
    height: document.querySelector("header")?.getBoundingClientRect().height,
    padding: getComputedStyle(document.documentElement).scrollPaddingTop,
  }));
  expect(height).toBe(100);
  expect(padding).toBe("100px");
});

// The islands never arrive: what the visitor sees is the inline script's.
test("a home page opened mid-scroll paints the solid bar before hydration", async ({ page }) => {
  await page.route("**/_next/static/chunks/**/*.js", route => route.abort());
  await page.setViewportSize(PHONE);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/fr#reviews");
  const header = page.locator("header").first();
  await expect(header).toHaveClass(/\blight\b/);
  await expect(header).toHaveAttribute("data-scrolled", "");
});

/** Two frames: a wheel's scroll is applied on the next one. */
const settle = (page: Page) =>
  page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));

test("the page behind the open menu does not scroll", async ({ page }) => {
  await load(page, "/fr/prices");
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.mouse.move(PHONE.width / 2, PHONE.height - 40);
  // The control: closed, the same wheel scrolls the page.
  const closed = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 300);
  await expect.poll(async () => (await settle(page), page.evaluate(() => window.scrollY))).toBeGreaterThan(closed);

  const details = page.locator("header details[data-nav-menu]");
  const box = await details.locator("summary").boundingBox();
  if (!box) throw new Error("the burger is not laid out");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(details).toHaveAttribute("open", "");
  await page.mouse.move(PHONE.width / 2, PHONE.height - 40);
  const open = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 300);
  await settle(page);
  await settle(page);
  expect(await page.evaluate(() => window.scrollY)).toBe(open);
});

test("Tab past the menu's last link closes it", async ({ page }) => {
  await load(page, "/fr/prices");
  const details = page.locator("header details[data-nav-menu]");
  await details.locator("summary").click();
  await expect(details).toHaveAttribute("open", "");
  await details.locator(":scope > nav a").last().focus();
  await page.keyboard.press("Tab");
  await expect(details).not.toHaveAttribute("open");
});

test.describe("on a touch screen", () => {
  test.use({ hasTouch: true });

  // Closing on the press hid the scrim under the finger, and the tap's click
  // then followed whatever link was beneath it.
  test("a tap on the scrim closes the menu and nothing under it", async ({ page }) => {
    await load(page, "/fr");
    const summary = page.locator("header details[data-nav-menu] > summary");
    await summary.tap();
    const details = page.locator("header details[data-nav-menu]");
    await expect(details).toHaveAttribute("open", "");
    const scrim = details.locator("[data-dismiss]");
    await expect(scrim).toBeVisible();
    const panel = await details.locator(":scope > nav").boundingBox();
    if (!panel) throw new Error("the panel is not laid out");

    // A point on the scrim with a link or a button under it once the menu is gone.
    const point = await page.evaluate(
      ({ from, width, height }) => {
        const scrimEl = document.querySelector<HTMLElement>("[data-dismiss]");
        if (!scrimEl) return null;
        scrimEl.style.pointerEvents = "none";
        try {
          for (let y = height - 10; y > from; y -= 10) {
            for (let x = 10; x < width; x += 20) {
              const hit = document.elementFromPoint(x, y)?.closest("a[href], button");
              if (hit && !hit.closest("header")) return { x, y };
            }
          }
          return null;
        } finally {
          scrimEl.style.pointerEvents = "";
        }
      },
      { from: panel.y + panel.height, width: PHONE.width, height: PHONE.height },
    );
    if (!point) throw new Error("no link or button under the scrim");

    const url = page.url();
    await page.touchscreen.tap(point.x, point.y);
    await expect(details).not.toHaveAttribute("open");
    await expect(scrim).toBeHidden();
    expect(page.url()).toBe(url);
    expect(await page.evaluate(() => document.activeElement?.closest("a[href], button") === null || !!document.activeElement?.closest("header"))).toBe(true);
  });
});
