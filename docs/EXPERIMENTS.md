# Experiments

A/B tests on a point's home page, measured in PostHog and steered from the
Service-Arb panel (its "Experiments" screen). The goal is more
customers reaching the business (a call, a WhatsApp message, a lead) per
visit. Every test is one change against the page as it is, and it ends: the
winner goes into the page, the loser is deleted.

## Running now

Three tests, drawn independently: a visitor is in one arm of each. The splits
below are the code's; the panel may have changed a split or switched a test
off since — its "Experiments" screen is what runs now.

### `hero_call_first`

- **Change (`b`).** Below `md` only — the desktop hero is the control. The
  hero's first action is a full-width `tel:` button, "Appeler un plombier" and
  the number; WhatsApp is the second, full-width; the quote form is still in the
  hero, further down, behind a link "ou recevez un devis écrit" (`#quote`).
- **Hypothesis.** A plumbing job is mostly booked by a call (the owner's
  estimate: 75–85 % of conversions come by phone), and the visitor arriving
  from Google Maps is on a phone with the problem happening now. Putting the
  call first, sized as the primary action, turns more of those visits into
  contacts than a form they have to scroll to and fill.
- **Evidence.** `docs/refs/sites/README.md`: "a homeowner standing in water
  needs the phone number and a price, immediately". The control already puts
  the phone in the hero, but as text beside a WhatsApp button, and gives the
  card's space to the form.

### `lead_form`

Three arms, 1:1:1, all on kitstart's `LeadCapture` in the same compact card
(Figma, Aquafix file, page "Lead form A/B"): placeholders instead of drawn
labels, one line under the mobile ("Prix par SMS sous 10 min. Votre numéro ne
sert qu’à ça."), and "Pas envie de taper ? Rappelez-moi" as a line of text
under the card. The call and WhatsApp stay where they were — the hero beside
the card and the call bar under it — so the card repeats neither.

- **`a`, compact (control).** One screen: the job as a select, the postcode,
  the mobile; after the job the focus moves to the next empty field. The
  card is 463 px tall at 390 in the frame: the SMS paragraph, the rule and the
  ticked privacy line under the submit are gone.
- **`b`, step by step.** One question per screen with a thin progress bar,
  "Retour" and the answered screens as chips: the job (a tile each), the
  postcode, the mobile. A postcode the page knows — Royat serves one — is
  not asked again, so there it is the job, then the mobile.
- **`c`, urgency first.** "C’est pour quand ?" — "Urgent — aujourd’hui",
  "Cette semaine", "Je compare les prix". Urgent turns the form into a call
  back: the mobile and the consent only, "Rappel immédiat". Otherwise the jobs
  as cards with an icon each, the postcode, the mobile. The answer goes with
  the lead as the extra `urgency` (`today`, `week`, `compare`): stored, sent to
  the panel and printed in the lead mail ("Urgence : Urgent — aujourd’hui").
- **Hypothesis.** A first question that is one tap and about the problem —
  or, for a plumber, about how soon — starts more forms than three fields at
  once, and a form started is mostly finished: `b` and `c` lift leads per
  visit over `a`. `c` also routes the visitor standing in water to a call back
  at once.
- **Metric.** Lead rate (`experiment_lead` ÷ `experiment_exposed`) is primary;
  the contact rate is the guardrail — an arm that wins leads by losing calls
  is not shipped.
- **Pooled with vifnet.** vifnet runs the same key; its `a` (compact) and `b`
  (step by step) are the same treatments, so the PostHog funnel filtered on
  `experiment` and `variant` alone, without `brand_id`, sums those two arms
  across brands (each site splits by the same weights — keep them equal in the
  panel). `c` is each brand's own hypothesis and is read per brand. The key is
  shared on purpose; never rename it. kitstart's own form events —
  `lead_form_view`, `lead_form_start`, `lead_form_field_error`,
  `lead_form_step` (each screen: `intro`, `need`, `locality`, `phone`), and the
  server's `lead_form_submit` — carry `experiment: "lead_form"` and the
  `variant`, for the funnel inside the form.

### `lead_channel`

Seven arms, 1:1:1:1:1:1:1 (MESSENGER-CHANNELS-SPEC §4; Figma, Aquafix file,
page "Lead form A/B", section 78:642 «Мессенджеры v3»), on kitstart's
`LeadCapture` `messenger` variants. WhatsApp is the customer sending our
prefilled message (the need, the postcode, the urgency when asked, and a
reference `Réf. AQ-7K3F`), answered by hand in WhatsApp Business; Telegram is
the place's bot opened as `t.me/<bot>?start=AQ-7K3F`; the phone is asked only
for a call. Every state of an arm keeps the card's height (the channel's slot
is 92 px, `e`'s 52 px, every main button 48 px; AQ-5's card is 449 px tall at 390).

- **`a`** — the control: today's card.
- **`b`, AQ-1** — a channel select inside the phone field, WhatsApp first: the
  number optional, «Envoyer sur WhatsApp →»; Appel — the number, «Rappelez-moi
  sous 10 min →»; Telegram — the bot.
- **`c`, AQ-2** — «WhatsApp | Appel» over the slot: the message ready, or the
  phone; «ou via Telegram» under the button.
- **`d`, AQ-3** — the control's form; the card stays after the lead («C’est
  noté !») and asks for a photo on WhatsApp (a QR code on a computer) and the bot.
- **`e`, AQ-4** — no phone: «Recevoir mon prix sur WhatsApp», then
  [Telegram][Être rappelé]; «Être rappelé» swaps the phone in.
- **`f`, AQ-5** — the channel first on a screen of its own, then the job and
  the channel's slot; «Changer de canal» back.
- **`g`, AQ-6** — «C’est urgent ?»: today a call, «je compare» the message. The
  answer is the lead's extra `urgency`, `today` or `later` (the mail prints
  «Pas urgent — compare» for `later`).

A place with the bot but without its own WhatsApp number — or with WhatsApp
switched off in the panel — draws the control in every arm, with «ou via
Telegram» (`d` and `g` keep their bot / question); no bot, no Telegram piece;
neither, and the arm is inert (below). The arm stays assigned: every kitstart event of the
card says `channels_available` (`wa,tg` | `wa` | `tg` | `none`) — read an arm
only where its channels were there. No place has its own WhatsApp number or bot yet:
until the owner sets them in the panel, every arm is inert.

- **Precedence over `lead_form`** (as vifnet's). At a place that offers a
  messenger — its own WhatsApp, or the bot — any arm but `a` draws the compact
  card (`lead_form` `a`), whatever the visitor's `lead_form` arm; such a
  visitor's `lead_form` events (`experiment_exposed`, `experiment_contact`,
  `experiment_lead`) carry `superseded: true`: leave them out of `lead_form`'s
  funnel (`superseded` is not `true`). kitstart's own form events name
  `lead_channel` for them, with `messenger_variant`. At a place with neither,
  the arm is inert: the card is the `lead_form` arm's, its events name
  `lead_form`, nothing is superseded. Which one a page was is the card's
  `channels_available` (on the page, and posted with the lead). Pausing
  `lead_form` in the panel instead is the owner's call.
- **Hypothesis.** A plumbing customer would rather send a message — with a
  photo of the leak — than type a phone number and wait: WhatsApp first, the
  message written for them, lifts contacts per visit over the phone-only form.
- **Metric.** Contact rate primary (a messenger tap posts the lead first, so
  it counts as `experiment_lead`); kitstart's `lead_messenger_return` (`sent` /
  `failed`) says how many chats were really started.
- **The lead.** A messenger lead is posted in the background before the app
  opens (`channel=whatsapp|telegram`, `message_ref`), needs no phone and no
  postcode, is mailed with «Canal» and «Réf.», and goes to the panel as its own
  channel with `properties.message_ref` (`PANEL_MESSENGER`).

### Ended

- **`lead_layout`** (one screen against the job first, `qualify-first`) —
  replaced by `lead_form`, whose `a` and `b` carry the question further.
- **`quote_price_anchor`** (each job's "from" price in the select and a
  fixed-price submit) — ended without a winner declared; the control (no
  prices in the form) stays, and its note "Sans engagement · Prix TTC" folds
  into the line under the mobile. The prices stay in the price table.

Their cookies are ignored and expire on their own.

## Metrics

| | Metric | Definition |
|---|---|---|
| Primary | contact rate | (`experiment_lead` + `experiment_contact` with `channel` phone or whatsapp) ÷ `experiment_exposed` |
| Guardrail | lead rate | `experiment_lead` ÷ `experiment_exposed` |

`lead_form` swaps the two: lead rate primary, contact rate the guardrail.
| Reported | form opens | `experiment_contact` with `channel = form_open` — an intent, not a contact |

The analytics are cookieless: every page load has a new `distinct_id`, so an
exposure and the lead it led to are never joined per person. The rates are
per page view, compared between arms in aggregate; both arms are counted the
same way, so the comparison is fair even though the absolute rate is not a
per-visitor conversion rate. A test that changes how many pages a visitor
looks at shifts its own denominator — read the exposure counts per arm, not
just the rates.

## Stop rule

A test is decided only when **all** hold:

1. it has run **≥ 14 days** (two full weeks: weekday and weekend traffic
   differ), and
2. each arm has **≥ ~100 exposures**, and
3. P(b > a) on the primary metric is **≥ 0.95** (ship `b`) or **≤ 0.05**
   (keep `a`).

A `b` that wins on contacts but whose lead rate has P(b > a) ≤ 0.05 is not
shipped: the guardrail vetoes it. Until the rule is met the answer is "keep
running", whatever the running probability says — looking early and stopping
on a lucky streak declares winners that are not.

## Reading the numbers

In PostHog, nowhere else: the panel does not count experiments. Its
"Experiments" screen links each test to a PostHog Insight — a funnel
`experiment_exposed` → `experiment_lead`, both filtered to the test's
`experiment` and the brand's `brand_id`, `forced` not `true`, broken down by
`variant`, from the day its weights last changed (or its first declaration).
For the contact rate add `experiment_contact` (with `channel` phone or
whatsapp) to the funnel or read it as a trend beside it. The stop rule above
is applied by a person to what PostHog shows.

## How it works

- **Config.** `src/shared/config/experiments.ts` — variants (one letter, `a`
  first: the control), and the default weights and `enabled`, with each
  test's hypothesis in one line (`EXPERIMENT_SUMMARIES`).
- **The panel.** At every start `instrumentation.ts` declares the experiments
  to the panel (`experiments.declared`, through the lead webhook's outbox:
  key, variants, weights, `enabled`, summary); a test the build no longer has
  shows there as retired. The panel's operator overrides `weights`, `enabled`
  and `holdout` per test; the site reads them from
  `<LOCATIONS_API_URL>/experiments` (`features/experiments/api/live.ts`,
  cached 30 s in memory, the last good answer kept while the panel is down,
  the code's config when there was none) and lays them over the code's config
  with `applyOverrides` — never a variant the code does not render. The
  proxy, the bucket and `experiment_lead` all go by that applied config.
- **Assignment.** `proxy.ts` → `features/experiments`: kitstart's routing, then
  `@evinvest/experiments`' `abProxy`, over the applied config, draws a variant per experiment on a
  visitor's first page of a point and keeps it in a cookie `ab_<experiment>`
  for 30 days. The apex brand page, `/quote` and the other non-page routes are
  not assigned.
- **Caching.** Pages stay ISR. The proxy rewrites a point's home to
  `/<locale>/<point>/ab/<letters>` — `ab/bc` is `hero_call_first=b`,
  `lead_form=c` — so each combination is its own
  cache entry and no page reads a cookie. All-control keeps the plain path. The canonical URL
  never carries the bucket.
- **Bots.** Crawlers, unfurlers and ad reviewers (user agent matching
  bot/crawl/spider/preview/AdsBot/…, or none) always get the control and no
  cookie, whatever they send, so no search engine sees a page a new visitor
  would not.
- **Events.** A client island beside kitstart's (`ExperimentBeacon`) sends
  `experiment_exposed {experiment, variant, forced}` on each location page
  view (the thank-you page excluded) and `experiment_contact {experiment,
  variant, channel, forced}` on a tap on `tel:`, `wa.me` or a
  `data-intent="form_open"` link, for every enabled experiment the browser has
  a cookie for. `/quote` sends `experiment_lead {experiment, variant, forced}`
  from the server, after the response, for exactly the leads kitstart counts
  as `lead_form_submit` (stored, not held as spam). kitstart's own events are
  unchanged; its allow-list would drop `variant`, so these go through a sink
  of their own with the same key and host. The exception is kitstart's lead
  form: `LeadCapture` is given `lead_form`'s assignment and puts it on its
  `lead_form_*` events itself (the kit's allow-list has `experiment` and
  `variant`). The page cannot tell a control visitor from a crawler — both get
  the plain path — so those events say `variant: "a"` for both; a crawler
  rarely runs the script that sends them, and `experiment_*` stays the
  arbiter.

## Forcing a variant (QA)

Add `?ab_<experiment>=<variant>` to a point's URL:

```text
https://royat.aquafix.top/fr?ab_hero_call_first=b
https://royat.aquafix.top/fr?ab_hero_call_first=b&ab_lead_form=c
https://royat.aquafix.top/fr?ab_lead_form=b
```

The forced variant is stored in the cookie, and a cookie `ab__qa=1` — kept
30 days, as long as the variant it marks — tags that browser's experiment
events `forced: true`, and also kitstart's `location_page_view` and
`contact_intent_click`, so a tester's reloads stay out of a place's traffic;
the PostHog funnel leaves them out. kitstart's lead-form events (`lead_form_*`,
`lead_booking_*`, the server's `lead_form_submit`) are not tagged yet
(EV-invest/lib#219): a QA lead still counts there. **Leave test** in
the QA menu (below), or deleting the site's cookies, makes the browser an
ordinary visitor again. A disabled experiment cannot be forced.

`ab__qa` is the QA mark's name on every brand (vifnet's too). Until October
2026 Aquafix called it `ab_forced`. That name is still read as a mark, and
the proxy moves it on a browser's next visit to a point: `ab__qa=1` set for
30 days, `ab_forced` deleted, on the same response — so a browser marked
before the rename stays a test, and the chip shows on that first load. The
legacy name is read until **2026-11-05**; then delete `LEGACY_QA_COOKIE`
(`src/shared/config/experiments.ts`) and the migration in the proxy.

### The QA menu on a phone

A forced visit also gets kitstart's A/B menu on a point's home page — the only
page the experiments run on: a chip in the bottom-right corner (on a phone, above the call bar) showing each test's current letter.

1. Open any point with a force parameter, e.g.
   `https://royat.aquafix.top/fr?ab_lead_form=a`. The proxy sets `ab__qa`,
   and the chip appears.
2. Tap the chip, then a variant: the page reloads with that variant forced.
3. **Reset** drops the assignments and draws new random variants; the visit
   stays a test and the menu stays. **Leave test** drops `ab__qa` too: the
   chip is gone and the browser counts as an ordinary visitor again.
   **Minimize** and **Hide** last until the next page load.

`ab__qa` lasts 30 days, like the variant it marks, so closing the browser
does not leave the test — use **Leave test**. (Until 2026-10 it was a session
cookie: a closed browser kept the forced variant but lost the mark.) A visitor without it never downloads the menu: the page's first load
carries only a small gate that checks for the cookie. Under `next dev` the chip
is always there. The tests and their labels come from `AB_SWITCHER_EXPERIMENTS`
in `src/shared/config/experiments.ts`.

## Ending an experiment

- **Stop now, keep the control:** switch the test off in the panel — no
  deploy. Within the source's 30 s everyone gets `a`: the proxy writes the
  control letter in the bucket whatever the cookie says, drops the test's
  `ab_*` cookie (so the browser's beacon stops counting it), and
  `experiment_lead` leaves it out. Switched back on, a visitor is drawn anew.
  `enabled: false` in the config does the same for good, with a deploy.
- **Re-weight:** in the panel. New visitors are drawn by the new weights;
  a visitor who already carries a cookie keeps their arm. Read the funnel from
  the change on (the panel's link does).
- **Ship the winner:** make the `b` rendering the page's only one (delete the
  `a` branch and the prop), delete the experiment from the config and its copy
  entries that are no longer read, and deploy. Old `ab_<experiment>` cookies
  are then ignored and expire on their own.

With every experiment removed or disabled, the proxy writes no bucket and the
home page is its single cached entry again.

## Caveats

- **A CDN in front must not cache HTML by URL alone.** Cloudflare does not
  cache HTML by default; a "cache everything" rule would serve one arm's page
  to both. If one is ever added, it has to bypass on `ab_` cookies.
- **Consent.** The `ab_*` cookies are functional (no identifier, one letter
  per test) and the analytics stay cookieless; whether French rules require
  consent for A/B-test cookies is the owner's call, not settled here.
