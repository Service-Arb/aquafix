import { DatabaseSync } from "node:sqlite";
import { LIBRARY_PROPS } from "@evinvest/analytics";
import { MIN_FILL_MS, normalizePhone } from "@evinvest/kitstart";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { JOB_IDS } from "../../src/shared/config/lead";
import { LEADS_DB, POSTHOG_HOST } from "./env";

// The funnel's floor: the form must submit before any JavaScript has loaded.
// A regression here is invisible to every other test in the suite and costs
// exactly the visitors the page is designed for.
test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the quote form posts, gets a 303 and the lead is stored", async ({ page }, testInfo) => {
    // A number no other test (or project) submits, so the row found is this one.
    const mobile = `06${String(Date.now() % 1e8).padStart(8, "0")}`;
    const zip = `63130-${testInfo.project.name}`;

    // `#quote` is the link every CTA points at, so the form is on screen on
    // arrival and the click needs no scroll of its own.
    await page.goto("/fr#quote");
    const form = page.locator("form#quote");
    await form.locator("select[name=job]").selectOption({ index: 1 });
    await form.locator("input[name=zip]").fill(zip);
    await form.locator("input[name=mobile]").fill(mobile);
    // The time trap drops anything faster than a person; this is a person.
    await page.waitForTimeout(MIN_FILL_MS + 250);

    const posted = page.waitForResponse(r => r.request().method() === "POST" && new URL(r.url()).pathname === "/quote");
    await form.locator("button[type=submit]").click();
    const response = await posted;
    expect(response.status()).toBe(303);
    await page.waitForURL("**/fr/thanks");

    // A suspected bot is answered with the same 303, so the redirect alone
    // proves nothing: the row is the proof, and it must not be flagged.
    const db = new DatabaseSync(LEADS_DB, { readOnly: true });
    try {
      // Stored as E.164 (`LEAD.mobileFormat`), not as typed.
      const row = db.prepare("SELECT zip, location_id, spam_verdict FROM leads WHERE mobile = ?").get(normalizePhone(mobile));
      expect(row).toEqual({ zip, location_id: "royat", spam_verdict: null });
    } finally {
      db.close();
    }
  });
});

// Once hydrated, the job is the kit's own list in the palette, not the
// platform's menu — and the pick still reaches the row. A native `<select>` is
// a combobox too, so the trigger is found as the button it becomes.
test("with JavaScript the job is the kit's listbox and the pick is stored", async ({ page }, testInfo) => {
  const mobile = `07${String(Date.now() % 1e8).padStart(8, "0")}`;
  const zip = `63130-js-${testInfo.project.name}`;

  await page.goto("/fr#quote");
  const form = page.locator("form#quote");
  const trigger = form.locator("button[role=combobox]");
  await expect(trigger).toBeVisible();
  await expect(form.locator("select")).toHaveCount(0);

  await trigger.click();
  const list = page.getByRole("listbox");
  await expect(list).toBeVisible();
  await list.getByRole("option").nth(1).click();
  await expect(list).toBeHidden();
  await expect(form.locator("input[name=job]")).toHaveValue(JOB_IDS[1]);

  await form.locator("input[name=zip]").fill(zip);
  await form.locator("input[name=mobile]").fill(mobile);
  await page.waitForTimeout(MIN_FILL_MS + 250);
  const posted = page.waitForResponse(r => r.request().method() === "POST" && new URL(r.url()).pathname === "/quote");
  await form.locator("button[type=submit]").click();
  expect((await posted).status()).toBe(303);
  await page.waitForURL("**/fr/thanks");

  const db = new DatabaseSync(LEADS_DB, { readOnly: true });
  try {
    const row = db.prepare("SELECT job, zip, spam_verdict FROM leads WHERE mobile = ?").get(normalizePhone(mobile));
    expect(row).toEqual({ job: JOB_IDS[1], zip, spam_verdict: null });
  } finally {
    db.close();
  }
});

// A tap on `tel:` hands the visitor to the dialler and tears the page down; an
// event sent the ordinary way is cancelled with it. The beacon must leave
// before the navigation does.
test("contact_intent_click reaches PostHog when the visitor leaves for tel:", async ({ page }) => {
  const events: { event: string; properties: Record<string, unknown> }[] = [];
  await page.route(`${POSTHOG_HOST}/**`, async route => {
    const body: unknown = JSON.parse(route.request().postData() ?? "null");
    if (typeof body === "object" && body !== null) {
      const event: unknown = Reflect.get(body, "event");
      const properties: unknown = Reflect.get(body, "properties");
      if (typeof event === "string" && typeof properties === "object" && properties !== null) {
        events.push({ event, properties: { ...properties } });
      }
    }
    await route.fulfill({ status: 200, body: "{}" });
  });

  const intent = page.waitForRequest(
    r => r.url().startsWith(POSTHOG_HOST) && (r.postData() ?? "").includes("contact_intent_click"),
  );
  await page.goto("/fr");
  // The page view is sent from the same island that tracks the click: once it
  // has arrived, the listener is attached and the click is not racing hydration.
  await expect.poll(() => events.some(e => e.event === "location_page_view")).toBe(true);

  await page.locator('main a[href^="tel:"]').first().click({ noWaitAfter: true });
  await intent;

  await expect.poll(() => events.find(e => e.event === "contact_intent_click")?.properties).toMatchObject({
    channel: "phone",
    location_id: "royat",
    brand_id: "aquafix",
  });
  // The allow-list at work: nothing about the visitor rides along.
  const props = Object.keys(events.find(e => e.event === "contact_intent_click")?.properties ?? {});
  const allowed = ["brand_id", "location_id", "channel", "source", "device", "form_id", ...LIBRARY_PROPS];
  expect(props.filter(p => !allowed.includes(p))).toEqual([]);
});

/**
 * An address of the test's own (the server trusts one `X-Forwarded-For` hop):
 * the funnel allows five leads per address in ten minutes, and every other
 * test posts from loopback.
 */
async function ownClient(page: Page, testInfo: TestInfo, slot: number): Promise<void> {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${slot * 10 + testInfo.parallelIndex}` });
}

// The job tapped on the page is not asked again: a work tile (or a price row)
// names it with `data-need`, and the form keeps it as chosen.
test("a tapped work tile is the job the form sends", async ({ page }, testInfo) => {
  const mobile = `06${String((Date.now() + 7) % 1e8).padStart(8, "0")}`;
  await ownClient(page, testInfo, 1);
  await page.goto("/fr");
  const form = page.locator("form#quote");
  // Hydrated: the tap is read by the form's script.
  await expect(form.locator("button[role=combobox]")).toBeVisible();
  await page.locator('#work button[data-need="hot_water"]').click();
  await page.keyboard.press("Escape");
  await expect(form.locator("input[type=hidden][name=job]")).toHaveValue("hot_water");
  await expect(form.locator("button[role=combobox]")).toHaveCount(0);

  await form.locator("input[name=zip]").fill(`63130-need-${testInfo.project.name}`);
  await form.locator("input[name=mobile]").fill(mobile);
  await page.waitForTimeout(MIN_FILL_MS + 250);
  const posted = page.waitForResponse(r => r.request().method() === "POST" && new URL(r.url()).pathname === "/quote");
  await form.locator("button[type=submit]").click();
  expect((await posted).status()).toBe(303);

  const db = new DatabaseSync(LEADS_DB, { readOnly: true });
  try {
    expect(db.prepare("SELECT job FROM leads WHERE mobile = ?").get(normalizePhone(mobile))).toEqual({ job: "hot_water" });
  } finally {
    db.close();
  }
});

// "Call me back": the phone and a consent, posted as its own lead. The consent
// is the sentence shown, kept word for word with the row.
test("the callback posts a lead with its consent", async ({ page }, testInfo) => {
  const mobile = `07${String((Date.now() + 13) % 1e8).padStart(8, "0")}`;
  await ownClient(page, testInfo, 2);
  await page.goto("/fr");
  const callback = page.locator("details#quote-callback");
  await callback.locator("summary").click();
  const form = callback.locator("form");
  await form.locator("input[name=mobile]").fill(mobile);
  const consent = form.locator("input[name=consent]");
  const sentence = await consent.getAttribute("value");
  expect(sentence).toMatch(/rappel/);
  await consent.check();
  await page.waitForTimeout(MIN_FILL_MS + 250);
  const posted = page.waitForResponse(r => r.request().method() === "POST" && new URL(r.url()).pathname === "/quote");
  await form.locator("button[type=submit]").click();
  expect((await posted).status()).toBe(303);

  const db = new DatabaseSync(LEADS_DB, { readOnly: true });
  try {
    const row = db.prepare("SELECT channel, consent_text, spam_verdict FROM leads WHERE mobile = ?").get(normalizePhone(mobile));
    expect(row).toEqual({ channel: "callback", consent_text: sentence, spam_verdict: null });
  } finally {
    db.close();
  }
});
