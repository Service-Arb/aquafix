import { DatabaseSync } from "node:sqlite";
import { expect, test } from "@playwright/test";
import { MIN_FILL_MS } from "../../src/features/quote-form/model/antispam";
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

    // A bot is answered with the same 303, so the redirect alone proves
    // nothing: the row is the proof.
    const db = new DatabaseSync(LEADS_DB, { readOnly: true });
    try {
      const row = db.prepare("SELECT zip, location_id FROM leads WHERE mobile = ?").get(mobile);
      expect(row).toEqual({ zip, location_id: "royat" });
    } finally {
      db.close();
    }
  });
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
  expect(props.every(p => ["brand_id", "location_id", "channel", "source", "device", "form_id"].includes(p) || p.startsWith("$"))).toBe(true);
});
