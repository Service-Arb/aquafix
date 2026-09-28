# Experiments

A/B tests on a point's home page, measured in PostHog. The goal is more
customers reaching the business (a call, a WhatsApp message, a lead) per
visit. Every test is one change against the page as it is, and it ends: the
winner goes into the page, the loser is deleted.

## Running now

Both split 50/50, independently: a visitor is in one arm of each.

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

### `quote_price_anchor`

- **Change (`b`).** The quote form's job list shows each job's published
  "from" price (`Canalisation bouchée · dès 149 €`), read from the same
  `PRICE_LIST` integer as the price table (`JOB_PRICE` maps a job to its row;
  the fit-out and "something else" are quoted on site and show none). The
  submit reads "Recevoir mon tarif fixe", with "Sans engagement · Prix TTC"
  under it — both already said elsewhere on the page. No new claim.
- **Hypothesis.** The price is the page's differentiator (no competitor
  publishes one), but it sits in a table below the fold; the form asks for a
  mobile number without restating it. Showing the price at the moment the
  visitor commits removes the fear the form otherwise raises — "they'll quote
  low and bill high" — and lifts form submissions.
- **Evidence.** `docs/refs/sites/README.md`, "Where we went further than any
  reference": the published price list is the single largest differentiator.

## Metrics

| | Metric | Definition |
|---|---|---|
| Primary | contact rate | (`experiment_lead` + `experiment_contact` with `channel` phone or whatsapp) ÷ `experiment_exposed` |
| Guardrail | lead rate | `experiment_lead` ÷ `experiment_exposed` |
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

```sh
POSTHOG_PERSONAL_API_KEY=phx_… npm run ab:report
npm run ab:report -- --brand aquafix --days 90
```

A personal API key with `query:read` on the EV Invest project (PostHog →
Settings → Personal API keys). `POSTHOG_PROJECT_ID` defaults to `614067`,
`POSTHOG_API_HOST` to `https://us.posthog.com`. The script runs one HogQL
query, filtered to the brand and excluding forced visits, and prints per
experiment × variant: exposures, leads, calls, WhatsApp, form opens, contact
rate, lead rate; then P(b > a) by Beta-Binomial Monte Carlo (uniform prior),
the expected loss of shipping `b` and of keeping `a` (percentage points), the
days since the first exposure, and the verdict of the stop rule above.

## How it works

- **Config.** `src/shared/config/experiments.ts` — variants (one letter, `a`
  first: the control), weights, `enabled`.
- **Assignment.** `proxy.ts` → `features/experiments`: kitstart's routing, then
  `@evinvest/experiments`' `abProxy` draws a variant per experiment on a
  visitor's first page of a point and keeps it in a cookie `ab_<experiment>`
  for 30 days. The apex brand page, `/quote` and the other non-page routes are
  not assigned.
- **Caching.** Pages stay ISR. The proxy rewrites a point's home to
  `/<locale>/<point>/ab/<letters>` — `ab/ba` is `hero_call_first=b`,
  `quote_price_anchor=a` — so each combination is its own cache entry and no
  page reads a cookie. All-control keeps the plain path. The canonical URL
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
  of their own with the same key and host.

## Forcing a variant (QA)

Add `?ab_<experiment>=<variant>` to a point's URL:

```text
https://royat.aquafix.top/fr?ab_hero_call_first=b
https://royat.aquafix.top/fr?ab_hero_call_first=b&ab_quote_price_anchor=b
```

The forced variant is stored in the cookie, and a session cookie `ab_forced=1`
marks every later event from that browser `forced: true`; the report leaves
them out. Close the browser (or delete the cookies) to become an ordinary
visitor again. A disabled experiment cannot be forced.

## Ending an experiment

- **Stop now, keep the control:** set `enabled: false` in the config and
  deploy. Everyone gets `a`, stored cookies are ignored.
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
