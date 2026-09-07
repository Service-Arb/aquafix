# Reference sites — why each one is here, and what Aquafix took from it

This folder is the evidence base for the Aquafix landing page. Every section of the
design traces back to something in here.

Each subfolder holds a dated `capture.html` (raw) + `capture.md` (readable) + `NOTES.md`
(what we took). Captures are static fetches — JS-rendered content may be missing. Re-run
the archive command at the bottom to refresh.

**Nothing in here was chosen because it looks good.** It was chosen because it converts,
or because it is the clearest published statement of a mechanic that converts. Where a
site is here as a *counter*-example, it says so.

---

## How to read the conversion evidence

Private home-services companies do not publish conversion rates. Anyone who tells you
"this plumbing site converts at 12%" is guessing. So every claim below carries a grade,
and the grade is the point:

| Grade | Means |
|---|---|
| **A** | Publicly verifiable number, checkable today (review counts, ad spend under management, named clients) |
| **B** | The company's own public claim about itself — believable but self-reported |
| **C** | Asserted by a marketing agency's roundup post — treat as a lead, not a fact |
| **D** | Our inference from the page itself — a mechanic we can see, whose effect we did not measure |

**We only copied mechanics at grade A or B, or ones that survive first-principles
reasoning about this specific purchase.** Grade C got us the shortlist and nothing more.

The honest summary: the strongest evidence in this folder is not a conversion rate. It is
that the highest-review-count, longest-surviving operators in the trade have independently
converged on the same four mechanics — **published/flat pricing, a punctuality penalty
the company pays, licence and insurance shown up front, and a workmanship warranty.**
Convergence across independent competitors is the best signal available here.

---

## The reference set

### The one the brief named

| Site | What it is | Evidence | Grade |
|---|---|---|---|
| [`hyros/`](hyros/) | B2B ad-attribution SaaS. The density benchmark. | "Tracking **$5B+ in ad spend** for Tony Robbins, Alex Hormozi, Whop & 5,000+ more". Headline: "Get **15%+ more customers** from the same ad spend. **Or you don't pay.**" | A (named clients, checkable) / B ($5B claim) |

**What Aquafix takes:** the *shape*, and the page geometry. Promise → guarantee → proof, in
the first screen, with no decoration between them. Hyros puts the risk reversal **inside
the headline** rather than in a trust badge further down. Our H1 does the same: *"…at a
price we agree before we start"* is the guarantee, not a separate section. The panel
system — white page, nothing bleeding to the viewport edge, a capped rounded panel per
section with air between — is measured off the live site and recorded in
[`hyros/NOTES.md`](hyros/NOTES.md).

**What we reject:** Hyros' loose, airy above-fold. That works for a considered B2B
purchase. A homeowner standing in water needs the phone number and a price, immediately —
so our hero is denser and the form is in it, not behind a click. The geometry and the
density are separate decisions: taking the first did not cost us the second.

---

### Plumbing operators — highest review counts we could verify

| Site | Verified proof on page | The one mechanic worth stealing | Grade |
|---|---|---|---|
| [`benjamin-franklin/`](benjamin-franklin/) | **119,705 reviews** (network-wide) | **"If we're not on time… we pay you $5.00 for each minute we're late, up to 60 minutes (or $300)."** The punctuality penalty, stated as a number. | A |
| [`genz-ryan/`](genz-ryan/) | **8,613 reviews** | Guarantee-as-product ("No Breakdown Guarantee"), financing surfaced above the fold, same-day service named in the hero | A |
| [`western-rooter/`](western-rooter/) | **4,700+ reviews** | Flat-rate + "no hidden fees" + free estimates stated as terms, 24/7 staffed | A |
| [`mr-rooter/`](mr-rooter/) | National franchise, 25 star-rating instances on page | **"You'll know exactly what you're paying upfront"** — flat-rate pricing with **"No overtime"** charges. Price certainty as the brand's whole position. | B |
| [`lorenz/`](lorenz/) | "On time" stated 5× on the homepage | Process transparency: video hero with real trucks, years in business, review volume above the fold | C |
| [`thelen-mechanical/`](thelen-mechanical/) | Financing surfaced 5× | Family-safety framing + lead form visible without scrolling | C |
| [`true-service/`](true-service/) | Minimal — "upfront", "free estimate" and little else | **Counter-example.** Clean minimalist homepage that answers almost nothing. Proof that stripping a page is only a win when the removed pixels weren't carrying an objection. | D |

---

## The convergence, and what it produced in our design

Four mechanics appear independently across the highest-review operators. Every one became
a section of the Aquafix page:

```
  THEIR MECHANIC                          OUR SECTION
  ────────────────────────────────────────────────────────────────────
  flat / upfront pricing            →  published 9-row price table
  (Mr. Rooter, Western Rooter)         "that is the entire price list"

  punctuality penalty the company   →  "2-hour window, or the call-out
  pays (Benjamin Franklin, $5/min)     is free" — hero bullet + pillar 02

  licence + insurance up front      →  proof bar under the hero,
  (Western Rooter, Mr. Rooter)         licence # in the eyebrow and footer

  workmanship warranty as a term    →  "12 months, parts and labour"
  (Genz-Ryan, Mr. Rooter)              — hero bullet + pillar 03
```

**Where we went further than any reference.** Not one of these sites publishes an actual
price list. They all say "upfront pricing" and then make you call to find out what upfront
means. Our nine-row table with real numbers and *"that is the entire price list — there is
nothing else"* is the single largest differentiator in the design, and it is the one thing
here with no reference to copy from. It is a bet, and it is the bet worth taking: it
converts the exact fear — *"they'll quote low and bill high"* — that every one of these
sites gestures at and none of them closes.

**The reviews decision.** Benjamin Franklin and Genz-Ryan both show curated 5-star walls.
We instead headline *"Read the one-star ones too"* and include a real 4-star review. A
perfect rating is read as filtered; a visible flaw is read as unfiltered. This is a
deliberate departure from every reference in the folder, and the reason the reviews block
is built as a live Elfsight embed slot rather than hand-written cards — hand-written
testimonials are the thing being argued against.

---

## The three operators (doctrine, not sites)

| Source | The rule we applied |
|---|---|
| **Alex Hormozi** — [`acquisition-hormozi/`](acquisition-hormozi/) | Value = (dream outcome × perceived likelihood) ÷ (time delay × effort). Risk reversal is the cheapest lever on the denominator. Every Aquafix guarantee is written as a *term the company pays for*, never as an adjective. "12-month workmanship warranty" not "quality you can trust". |
| **Alex Becker** | One page, one action. No pixel that does not either state the offer or prove it. Applied literally: copper `#E08A3C` is reserved for CTAs and appears nowhere else — the eye can always find the next action. |
| **Sam Owens / Ovens** | Niche narrowly and say no publicly. Produced two sections that most agencies would delete: *"Eight jobs. We do them properly and we say no to the rest"* and *"Thirty miles of Portland. We turn down everything past it."* Refusal is a credibility instrument. |

---

## Anti-patterns we rejected (and where we saw them)

- **Vague brand taglines.** Mr. Rooter's "There's a reason they call us Mr." says nothing. Every Aquafix headline states a term or a number.
- **Minimalism that removes answers.** `true-service/` — clean, fast, and silent on price, licence, warranty and who turns up. Our page is long *and* dense; length is not the enemy, unanswered questions are.
- **Heavy/industrial colour.** Roundups flag brown/muddy palettes as trust-killers in this trade. Our navy carries the credential and copper carries the craft; the only red on the page is the emergency bar dot.
- **Curated 5-star walls.** See the reviews decision above.

---

## Dead references (do not restore)

Two sites recommended by 2025-dated agency roundups are **parked domains** as of the
capture date — the businesses' sites are gone:

- `dallasplumbingcompany.com` → GoDaddy parking lander
- `mrmikesplumbing.com` → GoDaddy parking lander

`bearsplumbing.com` resolves, but it is a commercial / multi-family contractor site with no
consumer conversion path — not the consumer example the roundup described.

This is itself a finding: **agency "best of" roundups are stale and partly fabricated.**
They were useful for generating a shortlist and useless as evidence. Hence the grading
table at the top.

---

## Refreshing the archive

```sh
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
curl -sL --max-time 40 -A "$UA" -o docs/refs/sites/<slug>/capture.html <url>
pandoc -f html -t gfm --wrap=none docs/refs/sites/<slug>/capture.html -o docs/refs/sites/<slug>/capture.md
```

`acquisition-hormozi/capture.md` is a rendered transcript rather than a curl capture —
acquisition.com is a client-rendered SPA and static fetch returns only loading spinners.
