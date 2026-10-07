import { expect, test, type Locator, type Page } from "@playwright/test";
import { POSTHOG_HOST, ROYAT_TELEGRAM_BOT, ROYAT_WHATSAPP } from "./env";
import { freshMobile } from "./support/mobile";

// `lead_channel`'s arms (docs/EXPERIMENTS.md, MESSENGER-CHANNELS-SPEC §4) on
// the `messenger` project's server, where Royat has its own WhatsApp number
// and the brand's bot. Each arm is forced from the query, as the AbSwitcher
// does; the config's control cookies keep the other tests at `a`. Figma's rule
// is checked as the visitor would see it: every state of an arm, the card the
// same height.

/** The card: no role of its own, and the arm on it (`data-experiment`, `data-variant`) is what the page drew. */
const cardOf = (page: Page): Locator => page.locator("#quote");

/** A WhatsApp link with the message prefilled, its last line the reference: `…%0AR%C3%A9f.%20AQ-7K3F`. */
const WA_WITH_REF = new RegExp(`^https://wa\\.me/${ROYAT_WHATSAPP}\\?text=Bonjour%20Aquafix%20.*%0AR%C3%A9f\\.%20AQ-[0-9A-HJKMNP-TV-Z]{4}$`);

async function open(page: Page, arm: string): Promise<Locator> {
  // PostHog never answers here; the card's events must not wait on it.
  await page.route(`${POSTHOG_HOST}/**`, route => route.fulfill({ status: 200, body: "{}" }));
  await page.goto(`/fr?ab_lead_channel=${arm}`);
  const card = cardOf(page);
  await expect(card).toHaveAttribute("data-variant", arm);
  return card;
}

/** The reference the card minted, as it posts it with the lead. */
async function refOf(card: Locator): Promise<string> {
  const ref = await card.locator('input[type=hidden][name="message_ref"]').inputValue();
  expect(ref).toMatch(/^AQ-[0-9A-HJKMNP-TV-Z]{4}$/);
  return ref;
}

async function heightOf(card: Locator): Promise<number> {
  const box = await card.boundingBox();
  if (box === null) throw new Error("the card is not on the page");
  return box.height;
}

// Where the test runs (Royat here has its own WhatsApp), the control is the
// compact card under lead_channel's name, whatever lead_form says: the two
// tests' effects never mix (docs/EXPERIMENTS.md).
test("a, the control: the compact card under lead_channel, no messenger in it, though Royat has both", async ({ page }) => {
  await page.route(`${POSTHOG_HOST}/**`, route => route.fulfill({ status: 200, body: "{}" }));
  await page.goto("/fr?ab_lead_form=c&ab_lead_channel=a");
  const card = cardOf(page);
  await expect(card).toHaveAttribute("data-experiment", "lead_channel");
  await expect(card).toHaveAttribute("data-variant", "a");
  await expect(card).toHaveAttribute("data-channels-available", "wa,tg");
  await expect(card.getByText("C’est pour quand ?")).toHaveCount(0);
  await expect(card.getByRole("button", { name: "Envoyez-moi mon prix →" })).toBeVisible();
  await expect(card.getByRole("textbox", { name: "Votre mobile" })).toBeVisible();
  await expect(card.getByRole("link", { name: /WhatsApp|Telegram/ })).toHaveCount(0);
});

test("b, AQ-1: WhatsApp picked in the phone field, the number optional, the message ready", async ({ page }) => {
  const card = await open(page, "b");
  await expect(card).toHaveAttribute("data-experiment", "lead_channel");
  await expect(card.getByRole("combobox", { name: "Canal de réponse" })).toHaveText(/WhatsApp/);
  // The field keeps its label for assistive technology; the board says "optional" in the placeholder.
  const mobile = card.getByRole("textbox", { name: "Votre mobile" });
  await expect(mobile).toHaveAttribute("placeholder", "Mobile (facultatif)");
  const send = card.getByRole("link", { name: "Envoyer sur WhatsApp →" });
  await expect(send).toHaveAttribute("href", WA_WITH_REF);
  const ref = await refOf(card);
  await expect(send).toHaveAttribute("href", new RegExp(`%20${ref}$`));

  await card.getByRole("combobox", { name: "Canal de réponse" }).click();
  await page.getByRole("option", { name: /^Telegram/ }).click();
  await expect(card.getByRole("link", { name: "Ouvrir Telegram" })).toHaveAttribute("href", `https://t.me/${ROYAT_TELEGRAM_BOT}?start=${ref}`);
  await expect(mobile).toBeDisabled();
});

// A slow phone shows the server's card (React's inline script swaps the
// streamed board in) seconds before the bundle hydrates it. The reference is
// minted in the browser, so until then the WhatsApp button leads nowhere — no
// `href`, never a wa.me link without «Réf.» that would post no lead — and the
// hydrated one carries the reference.
test("b, AQ-1: the WhatsApp button is inert before the bundle hydrates, and carries the reference after", async ({ page: cold }) => {
  await cold.route("**/_next/static/chunks/**", route => route.abort());
  await cold.route(`${POSTHOG_HOST}/**`, route => route.fulfill({ status: 200, body: "{}" }));
  await cold.goto("/fr?ab_lead_channel=b");
  const inert = cardOf(cold).locator("a", { hasText: "Envoyer sur WhatsApp →" });
  await expect(inert).toBeVisible();
  expect(await inert.getAttribute("href")).toBeNull();
  await expect(cardOf(cold).locator('a[href^="https://wa.me/"]')).toHaveCount(0);

  // The same context, without the blocked bundle: the page hydrates.
  const warm = await cold.context().newPage();
  const card = await open(warm, "b");
  await expect(card.getByRole("link", { name: "Envoyer sur WhatsApp →" })).toHaveAttribute("href", WA_WITH_REF);
});

test("b, AQ-1: WhatsApp, Appel and Telegram keep the card's height", async ({ page }) => {
  const card = await open(page, "b");
  await expect(card.getByRole("link", { name: "Envoyer sur WhatsApp →" })).toBeVisible();
  const whatsapp = await heightOf(card);
  await card.getByRole("combobox", { name: "Canal de réponse" }).click();
  await page.getByRole("option", { name: /^Appel/ }).click();
  await expect(card.getByRole("button", { name: "Rappelez-moi sous 10 min →" })).toBeVisible();
  await expect.poll(() => heightOf(card)).toBe(whatsapp);
  await card.getByRole("combobox", { name: "Canal de réponse" }).click();
  await page.getByRole("option", { name: /^Telegram/ }).click();
  await expect(card.getByRole("link", { name: "Ouvrir Telegram" })).toBeVisible();
  await expect.poll(() => heightOf(card)).toBe(whatsapp);
});

test("c, AQ-2: «WhatsApp | Appel», the message ready, the bot under the button", async ({ page }) => {
  const card = await open(page, "c");
  const channel = card.getByRole("group", { name: "Canal de réponse" });
  await expect(channel.getByRole("button", { name: "WhatsApp" })).toHaveAttribute("aria-pressed", "true");
  await expect(card.getByText("Votre message est prêt")).toBeVisible();
  const ref = await refOf(card);
  await expect(card.getByText(`Réf. ${ref}`, { exact: false })).toBeVisible();
  await expect(card.getByRole("link", { name: "Envoyer sur WhatsApp →" })).toHaveAttribute("href", WA_WITH_REF);
  await expect(card.getByRole("link", { name: "ou via Telegram" })).toHaveAttribute("href", `https://t.me/${ROYAT_TELEGRAM_BOT}?start=${ref}`);

  await channel.getByRole("button", { name: "Appel" }).click();
  await expect(card.getByRole("textbox", { name: "Votre mobile" })).toBeVisible();
  await expect(card.getByRole("button", { name: "Rappelez-moi sous 10 min →" })).toBeVisible();
  await expect(card.getByText("Votre message est prêt")).toBeHidden();
});

test("c, AQ-2: WhatsApp and Appel keep the card's height", async ({ page }) => {
  const card = await open(page, "c");
  await expect(card.getByText("Votre message est prêt")).toBeVisible();
  const whatsapp = await heightOf(card);
  await card.getByRole("group", { name: "Canal de réponse" }).getByRole("button", { name: "Appel" }).click();
  await expect(card.getByRole("textbox", { name: "Votre mobile" })).toBeVisible();
  await expect.poll(() => heightOf(card)).toBe(whatsapp);
  await card.getByRole("group", { name: "Canal de réponse" }).getByRole("button", { name: "WhatsApp" }).click();
  await expect(card.getByText("Votre message est prêt")).toBeVisible();
  await expect.poll(() => heightOf(card)).toBe(whatsapp);
});

test("d, AQ-3: the control's form, then a photo on WhatsApp once the lead is sent", async ({ page }, testInfo) => {
  // An address of the test's own: the funnel allows five leads per address in ten minutes.
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${200 + testInfo.parallelIndex}` });
  const card = await open(page, "d");
  await expect(card).toHaveAttribute("data-experiment", "lead_channel");
  await expect(card.getByRole("link", { name: /WhatsApp/ })).toHaveCount(0);
  await card.getByRole("textbox", { name: "Votre mobile" }).fill(freshMobile("06"));
  await card.getByRole("button", { name: "Envoyez-moi mon prix →" }).click();

  const done = card.getByRole("status");
  await expect(done.getByText("C’est noté !")).toBeVisible();
  await expect(done.getByText("Plus rapide : envoyez une photo de la fuite")).toBeVisible();
  const photo = done.getByRole("link", { name: "Envoyer la photo sur WhatsApp" });
  await expect(photo).toHaveAttribute("href", WA_WITH_REF);
  const ref = /%20(AQ-[0-9A-HJKMNP-TV-Z]{4})$/.exec((await photo.getAttribute("href")) ?? "")?.[1];
  await expect(done.getByRole("link", { name: "Telegram" })).toHaveAttribute("href", `https://t.me/${ROYAT_TELEGRAM_BOT}?start=${ref}`);
});

test("e, AQ-4: no phone, WhatsApp first; «Être rappelé» swaps the phone in and back", async ({ page }) => {
  const card = await open(page, "e");
  await expect(card.getByRole("textbox", { name: "Votre mobile" })).toHaveCount(0);
  const ref = await refOf(card);
  await expect(card.getByRole("link", { name: "Recevoir mon prix sur WhatsApp" })).toHaveAttribute("href", WA_WITH_REF);
  await expect(card.getByRole("link", { name: "Telegram" })).toHaveAttribute("href", `https://t.me/${ROYAT_TELEGRAM_BOT}?start=${ref}`);

  await card.getByRole("button", { name: "Être rappelé" }).click();
  await expect(card.getByRole("textbox", { name: "Votre mobile" })).toBeVisible();
  await expect(card.getByRole("button", { name: "Rappelez-moi sous 10 min →" })).toBeVisible();
  await expect(card.getByRole("link", { name: "Recevoir mon prix sur WhatsApp" })).toHaveCount(0);

  await card.getByRole("button", { name: "Revenir à WhatsApp" }).click();
  await expect(card.getByRole("link", { name: "Recevoir mon prix sur WhatsApp" })).toBeVisible();
});

test("e, AQ-4: WhatsApp and «Être rappelé» keep the card's height", async ({ page }) => {
  const card = await open(page, "e");
  await expect(card.getByRole("link", { name: "Recevoir mon prix sur WhatsApp" })).toBeVisible();
  const whatsapp = await heightOf(card);
  await card.getByRole("button", { name: "Être rappelé" }).click();
  await expect(card.getByRole("textbox", { name: "Votre mobile" })).toBeVisible();
  await expect.poll(() => heightOf(card)).toBe(whatsapp);
});

test("f, AQ-5: the channel first, then the job with the channel's slot; «Changer de canal» goes back", async ({ page }) => {
  const card = await open(page, "f");
  await expect(card.getByText("Comment voulez-vous nous joindre ?")).toBeVisible();
  await card.getByRole("button", { name: /^WhatsApp Recommandé/ }).click();

  await expect(card.getByText("Votre message est prêt")).toBeVisible();
  const ref = await refOf(card);
  await expect(card.getByRole("link", { name: "Ouvrir WhatsApp →" })).toHaveAttribute("href", WA_WITH_REF);
  await expect(card.getByRole("link", { name: "Ouvrir WhatsApp →" })).toHaveAttribute("href", new RegExp(`%20${ref}$`));

  await card.getByRole("button", { name: "‹ Changer de canal" }).click();
  await card.getByRole("button", { name: /^Être rappelé/ }).click();
  await expect(card.getByRole("textbox", { name: "Votre mobile" })).toBeVisible();
  await expect(card.getByRole("button", { name: "Rappelez-moi →" })).toBeVisible();
});

test("f, AQ-5: the channel screen and each channel's step keep the card's height", async ({ page }) => {
  const card = await open(page, "f");
  await expect(card.getByRole("button", { name: /^WhatsApp Recommandé/ })).toBeVisible();
  const channels = await heightOf(card);
  await card.getByRole("button", { name: /^WhatsApp Recommandé/ }).click();
  await expect(card.getByRole("link", { name: "Ouvrir WhatsApp →" })).toBeVisible();
  await expect.poll(() => heightOf(card)).toBe(channels);
  await card.getByRole("button", { name: "‹ Changer de canal" }).click();
  await expect(card.getByRole("button", { name: /^Telegram/ })).toBeVisible();
  await expect.poll(() => heightOf(card)).toBe(channels);
  await card.getByRole("button", { name: /^Être rappelé/ }).click();
  await expect(card.getByRole("textbox", { name: "Votre mobile" })).toBeVisible();
  await expect.poll(() => heightOf(card)).toBe(channels);
});

test("g, AQ-6: «C’est urgent ?» — today a call, «je compare» the message ready", async ({ page }) => {
  const card = await open(page, "g");
  const urgent = card.getByRole("group", { name: "C’est urgent ?" });
  await urgent.getByRole("button", { name: "Non, je compare" }).click();
  await expect(card.getByText("Pas pressé ? Message prêt")).toBeVisible();
  const ref = await refOf(card);
  await expect(card.getByText(`Réf. ${ref}.`, { exact: false })).toBeVisible();
  await expect(card.getByRole("link", { name: "Recevoir mon prix sur WhatsApp" })).toHaveAttribute("href", WA_WITH_REF);
  await expect(card.getByRole("textbox", { name: "Votre mobile" })).toHaveCount(0);

  await urgent.getByRole("button", { name: "Oui, aujourd’hui" }).click();
  await expect(card.getByRole("textbox", { name: "Votre mobile" })).toBeVisible();
  await expect(card.getByRole("button", { name: "Rappelez-moi tout de suite →" })).toBeVisible();
  await expect(card.getByText("Pas pressé ? Message prêt")).toBeHidden();
});

test("g, AQ-6: no answer yet, «je compare» and «aujourd’hui» keep the card's height", async ({ page }) => {
  const card = await open(page, "g");
  const urgent = card.getByRole("group", { name: "C’est urgent ?" });
  await expect(urgent.getByRole("button", { name: "Non, je compare" })).toBeVisible();
  const unanswered = await heightOf(card);
  await urgent.getByRole("button", { name: "Non, je compare" }).click();
  await expect(card.getByText("Pas pressé ? Message prêt")).toBeVisible();
  await expect.poll(() => heightOf(card)).toBe(unanswered);
  await urgent.getByRole("button", { name: "Oui, aujourd’hui" }).click();
  await expect(card.getByRole("textbox", { name: "Votre mobile" })).toBeVisible();
  await expect.poll(() => heightOf(card)).toBe(unanswered);
});

// Where the arm draws the card (Royat here offers both), lead_form's events say
// superseded: its arm is not what the visitor saw (docs/EXPERIMENTS.md).
test("a drawn lead_channel arm marks lead_form's exposure superseded, and no other test's", async ({ page }) => {
  const exposed: Record<string, unknown>[] = [];
  await page.route(`${POSTHOG_HOST}/**`, async route => {
    const body: unknown = JSON.parse(route.request().postData() ?? "null");
    if (typeof body === "object" && body !== null && Reflect.get(body, "event") === "experiment_exposed") {
      const properties: unknown = Reflect.get(body, "properties");
      if (typeof properties === "object" && properties !== null) exposed.push({ ...properties });
    }
    await route.fulfill({ status: 200, body: "{}" });
  });
  await page.goto("/fr?ab_lead_form=c&ab_lead_channel=e");
  await expect(cardOf(page)).toHaveAttribute("data-experiment", "lead_channel");
  await expect
    .poll(() => exposed.map(p => [p["experiment"], p["variant"], p["superseded"], p["channels_available"]]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))))
    .toEqual([
      ["hero_call_first", "a", undefined, "wa,tg"],
      ["lead_channel", "e", undefined, "wa,tg"],
      ["lead_form", "c", true, "wa,tg"],
    ]);
});

