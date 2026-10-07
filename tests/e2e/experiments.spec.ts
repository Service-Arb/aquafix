import { DatabaseSync } from "node:sqlite";
import { MIN_FILL_MS, normalizePhone } from "@evinvest/kitstart";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { JOB_IDS } from "../../src/shared/config/lead";
import { LEADS_DB, POSTHOG_HOST } from "./env";
import { freshMobile } from "./support/mobile";

// The A/B tests (docs/EXPERIMENTS.md). Every other spec starts in the control
// (the config's `storageState`); these start with no assignment, like a new
// visitor, and reach a variant through the QA force parameter or a cookie.
test.use({ storageState: { cookies: [], origins: [] } });

// lead_channel pinned to its control wherever a test reads lead_form: any
// other arm draws the compact card whatever lead_form says.
const HERO_B = "/fr?ab_hero_call_first=b&ab_lead_form=a&ab_lead_channel=a";

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
    .map(e => ({
      experiment: e.properties["experiment"],
      variant: e.properties["variant"],
      forced: e.properties["forced"],
      channel: e.properties["channel"],
      superseded: e.properties["superseded"],
    }))
    .sort((a, b) => String(a.experiment).localeCompare(String(b.experiment)));

/** An address of the test's own: the funnel allows five leads per address in ten minutes (see funnel.spec.ts). */
async function ownClient(page: Page, testInfo: TestInfo, slot: number): Promise<void> {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${slot * 10 + testInfo.parallelIndex}` });
}

/** The stored row for one number: what the lead carried, as the store keeps it. */
function rowFor(mobile: string): { job: string; channel: string; extras: string | null } | undefined {
  const db = new DatabaseSync(LEADS_DB, { readOnly: true });
  try {
    const row = db.prepare("SELECT job, channel, extras FROM leads WHERE mobile = ?").get(normalizePhone(mobile));
    return row === undefined ? undefined : { job: String(row.job), channel: String(row.channel), extras: row.extras === null ? null : String(row.extras) };
  } finally {
    db.close();
  }
}

/**
 * A tap on a tile, as the radio receives it: a pointer down, then the click.
 * Dispatched, not clicked at coordinates — on a phone the sticky call bar may
 * sit over the tile, and a click there dials.
 */
async function tap(page: Page, value: string): Promise<void> {
  const radio = page.locator(`form#quote-form input[type=radio][value="${value}"]`);
  await expect(radio).toBeAttached();
  await radio.dispatchEvent("pointerdown");
  await radio.dispatchEvent("click");
}

test("a new visitor is assigned a sticky variant of every experiment", async ({ page, context }) => {
  await page.goto("/fr");
  const first = (await context.cookies()).filter(c => c.name.startsWith("ab_"));
  expect(first.map(c => c.name).sort()).toEqual(["ab_hero_call_first", "ab_lead_channel", "ab_lead_form"]);
  await page.goto("/fr/prices");
  expect((await context.cookies()).filter(c => c.name.startsWith("ab_"))).toEqual(first);
});

test("hero_call_first b puts the call first on a phone", async ({ page }, testInfo) => {
  await page.goto(HERO_B);
  const hero = page.locator("main > section").first();
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
});

// lead_form a, the control: the compact card — no visible labels, one line
// under the mobile, the call back as a line of text — about one screen tall.
test("lead_form a is the compact card on one screen", async ({ page }) => {
  await page.goto("/fr?ab_lead_form=a&ab_lead_channel=a");
  const card = page.locator("#quote");
  const form = card.locator("form#quote-form");
  await expect(form.locator("button[role=combobox]")).toBeVisible();
  await expect(form.locator("input[name=zip]")).toBeVisible();
  await expect(form.locator("input[name=mobile]")).toHaveAttribute("placeholder", "Mobile · 06 00 00 00 00");
  // The labels are the fields' accessible names, not drawn.
  await expect(form.getByText("Votre mobile", { exact: true })).toHaveClass(/sr-only/);
  await expect(form.getByText("Prix par SMS sous 10 min. Votre numéro ne sert qu’à ça.")).toBeVisible();
  await expect(form.getByRole("button", { name: /Envoyez-moi mon prix/ })).toBeVisible();
  await expect(card.locator("details#quote-callback summary")).toHaveText("Pas envie de taper ?Rappelez-moi");
  await expect(card.getByRole("progressbar")).toHaveCount(0);
  // The old trust block (the SMS paragraph, the rule, the ticked privacy line) is gone.
  await expect(card.getByText(/Nous vous envoyons votre fourchette/)).toHaveCount(0);
  // Figma's 463px at 390 (54:525); a few px of type metrics either way.
  const box = await card.boundingBox();
  expect(box?.height ?? 0).toBeLessThan(500);
});

test("exposure and contact events carry the experiment and the variant", async ({ page }) => {
  const events = await capture(page);
  await page.goto("/fr?ab_hero_call_first=b&ab_lead_form=c&ab_lead_channel=a");
  await expect.poll(() => of(events, "experiment_exposed")).toEqual([
    { experiment: "hero_call_first", variant: "b", forced: true, channel: undefined },
    { experiment: "lead_channel", variant: "a", forced: true, channel: undefined },
    { experiment: "lead_form", variant: "c", forced: true, channel: undefined },
  ]);
  const exposed = events.find(e => e.event === "experiment_exposed")?.properties;
  expect(exposed).toMatchObject({ brand_id: "aquafix", location_id: "royat" });

  await page.locator('main a[href^="tel:"]:visible').first().click({ noWaitAfter: true });
  await expect.poll(() => of(events, "experiment_contact")).toEqual([
    { experiment: "hero_call_first", variant: "b", forced: true, channel: "phone" },
    { experiment: "lead_channel", variant: "a", forced: true, channel: "phone" },
    { experiment: "lead_form", variant: "c", forced: true, channel: "phone" },
  ]);
  // Under lead_channel's control, lead_form's arm is the one drawn: no mark at all, not `false`.
  for (const e of events.filter(e => e.event.startsWith("experiment_"))) expect(e.properties, e.event).not.toHaveProperty("superseded");
});

// Any lead_channel arm but a draws the compact card whatever lead_form says
// (docs/EXPERIMENTS.md): lead_form's events say so, the others' do not.
test("under a lead_channel arm, lead_form's exposure and contact are marked superseded", async ({ page }) => {
  const events = await capture(page);
  await page.goto("/fr?ab_hero_call_first=b&ab_lead_form=c&ab_lead_channel=e");
  await expect.poll(() => of(events, "experiment_exposed")).toEqual([
    { experiment: "hero_call_first", variant: "b", forced: true, channel: undefined, superseded: undefined },
    { experiment: "lead_channel", variant: "e", forced: true, channel: undefined, superseded: undefined },
    { experiment: "lead_form", variant: "c", forced: true, channel: undefined, superseded: true },
  ]);
  await page.locator('main a[href^="tel:"]:visible').first().click({ noWaitAfter: true });
  await expect.poll(() => of(events, "experiment_contact")).toEqual([
    { experiment: "hero_call_first", variant: "b", forced: true, channel: "phone", superseded: undefined },
    { experiment: "lead_channel", variant: "e", forced: true, channel: "phone", superseded: undefined },
    { experiment: "lead_form", variant: "c", forced: true, channel: "phone", superseded: true },
  ]);
  const unmarked = events.filter(e => e.event.startsWith("experiment_") && e.properties["experiment"] !== "lead_form");
  for (const e of unmarked) expect(e.properties, `${e.event} ${String(e.properties["experiment"])}`).not.toHaveProperty("superseded");
});

// Royat here has no WhatsApp of its own: the arm stays assigned and named,
// and the card is the control's, compact — not lead_form c's urgency first.
test("a lead_channel arm at a point without WhatsApp draws the compact control, whatever lead_form says", async ({ page }) => {
  await page.goto("/fr?ab_lead_form=c&ab_lead_channel=c");
  const card = page.locator("#quote");
  await expect(card).toHaveAttribute("data-experiment", "lead_channel");
  await expect(card).toHaveAttribute("data-variant", "c");
  await expect(card).toHaveAttribute("data-channels-available", "none");
  await expect(card.getByRole("button", { name: /Envoyez-moi mon prix/ })).toBeVisible();
  await expect(card.getByText("C’est pour quand ?")).toHaveCount(0);
  await expect(card.getByRole("link", { name: /WhatsApp|Telegram/ })).toHaveCount(0);
});

test("an assigned (not forced) visit says forced: false", async ({ page, context }) => {
  await context.addCookies([
    { name: "ab_hero_call_first", value: "b", url: "http://royat.localhost" },
    { name: "ab_lead_form", value: "b", url: "http://royat.localhost" },
    { name: "ab_lead_channel", value: "a", url: "http://royat.localhost" },
  ]);
  const events = await capture(page);
  await page.goto("/fr");
  await expect.poll(() => of(events, "experiment_exposed")).toEqual([
    { experiment: "hero_call_first", variant: "b", forced: false, channel: undefined },
    { experiment: "lead_channel", variant: "a", forced: false, channel: undefined },
    { experiment: "lead_form", variant: "b", forced: false, channel: undefined },
  ]);
});

test("a crawler gets the control and no cookie, even when it asks for b or c", async ({ request }) => {
  for (const ua of ["Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", "AdsBot-Google (+http://www.google.com/adsbot.html)", "Mozilla/5.0 (compatible; bingbot/2.0)"]) {
    const res = await request.get("/fr?ab_hero_call_first=b&ab_lead_form=c", { headers: { "user-agent": ua } });
    expect(res.status(), ua).toBe(200);
    expect(res.headersArray().filter(h => h.name.toLowerCase() === "set-cookie" && h.value.startsWith("ab_")), ua).toEqual([]);
    const html = await res.text();
    expect(html, ua).not.toContain("Appeler un plombier");
    expect(html, ua).not.toContain("C’est pour quand");
  }
});

// lead_form b: kitstart's `steps` — the job, then (Royat's one postcode known,
// so not asked) the mobile — and the form's events carry the arm.
test("lead_form b asks one question per screen, and its events carry the arm", async ({ page }, testInfo) => {
  const events = await capture(page);
  const mobile = freshMobile("06");
  await ownClient(page, testInfo, 7);
  await page.goto("/fr?ab_lead_form=b&ab_lead_channel=a");
  const card = page.locator("#quote");
  const form = card.locator("form#quote-form");
  const phone = form.locator("input[name=mobile]");
  await expect(card.getByText("Obtenez votre prix fixe")).toBeVisible();
  await expect(phone).toBeHidden();
  await expect(form.getByRole("radio")).toHaveCount(JOB_IDS.length);
  await tap(page, "hot_water");
  await expect(phone).toBeVisible();
  await expect(phone).toBeFocused();
  // The answered job is a chip; the head gives way to it.
  await expect(form.getByRole("button", { name: /Eau chaude/ })).toBeVisible();
  await expect(card.getByText("Obtenez votre prix fixe")).toBeHidden();
  await expect
    .poll(() => events.find(e => e.event === "lead_form_view")?.properties)
    .toMatchObject({ experiment: "lead_form", variant: "b", layout: "steps", form_id: "quote", brand_id: "aquafix" });
  await expect.poll(() => events.find(e => e.event === "lead_form_step")?.properties).toMatchObject({ step: "phone", experiment: "lead_form", variant: "b" });

  // "Retour" opens the screen it skipped, the postcode, filled; "Suivant" comes back.
  await form.getByRole("button", { name: /Retour/ }).click();
  await expect(form.locator("input[name=zip]")).toHaveValue("63130");
  await expect(phone).toBeHidden();
  await form.getByRole("button", { name: /Suivant/ }).click();

  await phone.fill(mobile);
  await page.waitForTimeout(MIN_FILL_MS + 250);
  await form.getByRole("button", { name: /Envoyez-moi mon prix/ }).click();
  await expect.poll(() => rowFor(mobile)).toEqual({ job: "hot_water", channel: "form", extras: null });
});

test("lead_form b: arrows move the choice, Space moves on", async ({ page }) => {
  await page.goto("/fr?ab_lead_form=b&ab_lead_channel=a");
  const form = page.locator("form#quote-form");
  const tiles = form.getByRole("radio");
  await expect(tiles.first()).toBeVisible();
  await tiles.first().evaluate(el => el.scrollIntoView({ block: "center" }));
  await tiles.first().focus();
  await page.keyboard.press("ArrowDown");
  await expect(tiles.nth(1)).toBeFocused();
  await expect(tiles.nth(1)).toBeChecked();
  await page.keyboard.press("Space");
  await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute("name"))).toBe("mobile");
  await expect(form.locator(`input[name=job][value="${JOB_IDS[1]}"]`)).toBeChecked();
});

// lead_form c, not urgent: the urgency, then the jobs as icon cards, then the
// mobile; the urgency goes with the lead.
test("lead_form c asks the urgency first, then the job on a card", async ({ page }, testInfo) => {
  const mobile = freshMobile("07");
  await ownClient(page, testInfo, 8);
  await page.goto("/fr?ab_lead_form=c&ab_lead_channel=a");
  const form = page.locator("form#quote-form");
  await expect(form.getByText("C’est pour quand ?")).toBeVisible();
  await expect(form.getByText("Prix fixe par SMS sous 10 min")).toBeVisible();
  await tap(page, "week");
  const cards = form.locator('input[name=job] + span');
  await expect(cards).toHaveCount(JOB_IDS.length);
  await expect(cards.locator("svg")).toHaveCount(JOB_IDS.length);
  await tap(page, "blocked_drain");
  await expect(form.getByRole("button", { name: /Cette semaine/ })).toBeVisible();
  const phone = form.locator("input[name=mobile]");
  await expect(phone).toBeFocused();
  await phone.fill(mobile);
  await page.waitForTimeout(MIN_FILL_MS + 250);
  await form.getByRole("button", { name: /Envoyez-moi mon prix/ }).click();
  await expect.poll(() => rowFor(mobile)).toEqual({ job: "blocked_drain", channel: "form", extras: JSON.stringify({ urgency: "week" }) });
});

// lead_form c, urgent: the phone and the consent only, posted as a call back.
test("lead_form c, urgent today, is a call back with the phone alone", async ({ page }, testInfo) => {
  const mobile = freshMobile("06");
  await ownClient(page, testInfo, 9);
  await page.goto("/fr?ab_lead_form=c&ab_lead_channel=a");
  const form = page.locator("form#quote-form");
  await tap(page, "today");
  await expect(form.getByText("On vous rappelle tout de suite", { exact: true }).last()).toBeVisible();
  await expect(form.getByText("Votre numéro ne sert qu’à ce rappel.")).toBeVisible();
  await expect(form.getByText("Prix par SMS sous 10 min. Votre numéro ne sert qu’à ça.")).toBeHidden();
  await expect(form.getByRole("radio", { name: /Canalisation bouchée/ })).toBeHidden();
  // The folded call back is not offered a second time.
  await expect(page.locator("details#quote-callback")).toHaveCount(0);
  await form.locator("input[name=mobile]").fill(mobile);
  await form.locator("input[name=consent]").check();
  await page.waitForTimeout(MIN_FILL_MS + 250);
  await form.getByRole("button", { name: "Rappel immédiat" }).click();
  await expect.poll(() => rowFor(mobile)?.channel).toBe("callback");
  expect(rowFor(mobile)?.extras).toBe(JSON.stringify({ urgency: "today" }));
});

/** The properties of the first `location_page_view` the page sends to PostHog. */
async function pageView(page: Page, url: string): Promise<Record<string, unknown>> {
  await capture(page);
  const sent = page.waitForRequest(req => req.url().startsWith(POSTHOG_HOST) && (req.postData() ?? "").includes('"location_page_view"'));
  await page.goto(url);
  const body: unknown = JSON.parse((await sent).postData() ?? "null");
  const properties: unknown = typeof body === "object" && body !== null ? Reflect.get(body, "properties") : undefined;
  if (typeof properties !== "object" || properties === null) throw new Error("a page view without properties");
  return { ...properties };
}

// The QA cookie marks the page view too, so a tester's reloads stay out of a
// place's traffic; an ordinary visit's page view carries no `forced` at all.
test("a forced visit's page view says forced: true", async ({ page }) => {
  expect(await pageView(page, "/fr?ab_lead_form=b")).toMatchObject({ forced: true, location_id: "royat" });
});

test("a new visitor's page view has no forced key", async ({ page }) => {
  const properties = await pageView(page, "/fr");
  expect(properties).toMatchObject({ location_id: "royat" });
  expect(properties).not.toHaveProperty("forced");
});
