import { expect, test, type Page } from "@playwright/test";
import { POSTHOG_HOST } from "./env";

// The A/B tests (docs/EXPERIMENTS.md). Every other spec starts in the control
// (the config's `storageState`); these start with no assignment, like a new
// visitor, and reach a variant through the QA force parameter or a cookie.
test.use({ storageState: { cookies: [], origins: [] } });

// `lead_layout` held at `a`: the price anchor is asserted on the select.
const BOTH_B = "/fr?ab_hero_call_first=b&ab_quote_price_anchor=b&ab_lead_layout=a";

type Captured = { event: string; properties: Record<string, unknown> };

async function capture(page: Page): Promise<Captured[]> {
  const events: Captured[] = [];
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
  return events;
}

const of = (events: Captured[], event: string) =>
  events
    .filter(e => e.event === event)
    .map(e => ({ experiment: e.properties["experiment"], variant: e.properties["variant"], forced: e.properties["forced"], channel: e.properties["channel"] }))
    .sort((a, b) => String(a.experiment).localeCompare(String(b.experiment)));

test("a new visitor is assigned a sticky variant of every experiment", async ({ page, context }) => {
  await page.goto("/fr");
  const first = (await context.cookies()).filter(c => c.name.startsWith("ab_"));
  expect(first.map(c => c.name).sort()).toEqual(["ab_hero_call_first", "ab_lead_layout", "ab_quote_price_anchor"]);
  await page.goto("/fr/prices");
  expect((await context.cookies()).filter(c => c.name.startsWith("ab_"))).toEqual(first);
});

test("variant b of both experiments renders", async ({ page }, testInfo) => {
  await page.goto(BOTH_B);
  const hero = page.locator("main > section").first();
  // hero_call_first: the phone first, below `md` only.
  const call = hero.getByRole("link", { name: /Appeler un plombier/ });
  const written = hero.getByRole("link", { name: "ou recevez un devis écrit" });
  if (testInfo.project.name === "mobile") {
    await expect(call).toBeVisible();
    await expect(call).toHaveAttribute("href", /^tel:/);
    await expect(written).toBeVisible();
  } else {
    await expect(call).toBeHidden();
    await expect(written).toBeHidden();
  }
  // quote_price_anchor: the fixed-price submit, and each job's published price.
  const form = page.locator("form#quote");
  await expect(form.getByRole("button", { name: /Recevoir mon tarif fixe/ })).toBeVisible();
  await expect(form.getByText("Sans engagement · Prix TTC")).toBeVisible();
  await form.locator("button[role=combobox]").click();
  await expect(page.getByRole("option", { name: /^Canalisation bouchée · dès 149\s€$/ })).toBeVisible();
  await expect(page.getByRole("option", { name: "Autre chose" })).toBeVisible();
});

test("the control renders as before", async ({ page, context }) => {
  await context.addCookies([
    { name: "ab_hero_call_first", value: "a", url: "http://royat.localhost" },
    { name: "ab_quote_price_anchor", value: "a", url: "http://royat.localhost" },
    { name: "ab_lead_layout", value: "a", url: "http://royat.localhost" },
  ]);
  await page.goto("/fr");
  await expect(page.getByRole("link", { name: /Appeler un plombier/ })).toHaveCount(0);
  await expect(page.locator("form#quote").getByRole("button", { name: /Envoyez-moi mon prix/ })).toBeVisible();
});

test("exposure and contact events carry the experiment and the variant", async ({ page }) => {
  const events = await capture(page);
  await page.goto(BOTH_B);
  await expect.poll(() => of(events, "experiment_exposed")).toEqual([
    { experiment: "hero_call_first", variant: "b", forced: true, channel: undefined },
    { experiment: "lead_layout", variant: "a", forced: true, channel: undefined },
    { experiment: "quote_price_anchor", variant: "b", forced: true, channel: undefined },
  ]);
  const exposed = events.find(e => e.event === "experiment_exposed")?.properties;
  expect(exposed).toMatchObject({ brand_id: "aquafix", location_id: "royat" });

  await page.locator('main a[href^="tel:"]:visible').first().click({ noWaitAfter: true });
  await expect.poll(() => of(events, "experiment_contact")).toEqual([
    { experiment: "hero_call_first", variant: "b", forced: true, channel: "phone" },
    { experiment: "lead_layout", variant: "a", forced: true, channel: "phone" },
    { experiment: "quote_price_anchor", variant: "b", forced: true, channel: "phone" },
  ]);
});

test("an assigned (not forced) visit says forced: false", async ({ page, context }) => {
  await context.addCookies([
    { name: "ab_hero_call_first", value: "b", url: "http://royat.localhost" },
    { name: "ab_quote_price_anchor", value: "a", url: "http://royat.localhost" },
    { name: "ab_lead_layout", value: "b", url: "http://royat.localhost" },
  ]);
  const events = await capture(page);
  await page.goto("/fr");
  await expect.poll(() => of(events, "experiment_exposed")).toEqual([
    { experiment: "hero_call_first", variant: "b", forced: false, channel: undefined },
    { experiment: "lead_layout", variant: "b", forced: false, channel: undefined },
    { experiment: "quote_price_anchor", variant: "a", forced: false, channel: undefined },
  ]);
});

test("a crawler gets the control and no cookie, even when it asks for b", async ({ request }) => {
  for (const ua of ["Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", "AdsBot-Google (+http://www.google.com/adsbot.html)", "Mozilla/5.0 (compatible; bingbot/2.0)"]) {
    const res = await request.get(BOTH_B, { headers: { "user-agent": ua } });
    expect(res.status(), ua).toBe(200);
    expect(res.headersArray().filter(h => h.name.toLowerCase() === "set-cookie" && h.value.startsWith("ab_")), ua).toEqual([]);
    const html = await res.text();
    expect(html, ua).not.toContain("Appeler un plombier");
    expect(html, ua).not.toContain("Recevoir mon tarif fixe");
  }
});

// lead_layout b: kitstart's `qualify-first` — a tile per job, then the contact
// step — and the form's own events carry the arm, so the brands pool.
test("lead_layout b asks the job first, and its events carry the arm", async ({ page }) => {
  const events = await capture(page);
  await page.goto("/fr?ab_lead_layout=b&ab_quote_price_anchor=b");
  const form = page.locator("form#quote");
  const phone = form.locator("input[name=mobile]");
  await expect(phone).toBeHidden();
  // The price anchor rides on the tiles' labels.
  const tile = form.getByRole("radio", { name: /^Canalisation bouchée · dès 149\s€$/ });
  // Centred first: on a phone the sticky call bar covers the bottom of the
  // viewport, where a scroll-if-needed would leave the tile.
  await tile.evaluate(el => el.scrollIntoView({ block: "center" }));
  await tile.click();
  await expect(phone).toBeVisible();
  await expect(form.getByRole("button", { name: /Recevoir mon tarif fixe/ })).toBeVisible();
  await expect
    .poll(() => events.find(e => e.event === "lead_form_view")?.properties)
    .toMatchObject({ experiment: "lead_layout", variant: "b", layout: "qualify-first", form_id: "quote", brand_id: "aquafix" });
  await expect.poll(() => events.find(e => e.event === "lead_form_step")?.properties).toMatchObject({ step: "contact", experiment: "lead_layout", variant: "b" });
});
