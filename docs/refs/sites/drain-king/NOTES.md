# drainkingplumbers.ca

Toronto drains and plumbing, 2,818 Google reviews. Here for two things, one of
which is not yet built.

Captured 2026-09-16. The `/services/` page is a navigation index, not a page of
copy — every service links to its own page, and that is where the substance is.
The four we read are listed below.

## What we took: the job descriptions

**Grade D** — a mechanic we can see, whose conversion effect we did not measure.

Their service pages answer a question our page never did: *what actually happens
when you turn up?* Each one opens on symptoms as the customer experiences them
("foul odours", "gurgling noises when you flush", "running water in the pipes
but generally low water pressure"), then says what the technician does and with
what. That is the shape `quiet`'s work cards now use — symptom first in the
customer's words, then the method, then the one thing we will tell you that
costs us money.

Source pages, and the facts each gave us:

| page | what we used |
|---|---|
| `/services/drains/drain-cleaning/` | symptoms (slow water, gurgle, odour, backup); tools — "snake augers, drain rooters"; that camera inspection, hydro-jetting and root removal are separate named services |
| `/services/plumbing/water-heater-services/` | the annual maintenance list — flush sediment, check for leaks, test the pressure relief valve, check ventilation and gas/electric connections |
| `/services/plumbing/plumbing-repairs/` | symptoms (gurgling, low pressure, slow draining, odours, water stains or standing water); leaks located with equipment rather than exploratory opening; 60–90 minute emergency response target |
| `/services/fixture-installation-maintenance/faucet-installation-maintenance/` | symptoms (drip, low pressure, poor temperature control); that a typical faucet is under an hour and removing the old one takes longer than fitting the new; descaling as a real repair |

**The substance is theirs; none of the sentences are.** Their copy is
search-optimised and written to fill a page — ours is four paragraphs with a
word budget, and each ends on a concession their pages do not make (we will tell
you it is the sewer line, we will tell you the tank is finished). That
concession is the Hormozi mechanic the rest of the page is already argued from,
applied to a service description.

## What we have not taken yet: the review strip

Their `/services/` page carries an embedded Google reviews rail —
`google-reviews-strip.png` in this folder. It is worth copying almost exactly:

- the aggregate card on the left: business name, 4.5 stars drawn, **2,818 Google
  reviews**, and a `Write a review` button
- then a horizontal rail of individual reviews, each with avatar, reviewer name,
  relative date ("1 month ago"), five drawn stars, the Google glyph, and a
  **verified tick**
- long reviews truncate to three lines with `Read more`
- a `>` arrow to page the rail, and `VIEW ALL` beneath

Why it is strong, and why it beats what `bands` and `quiet` both do today: every
element of it is *checkable*. The count, the glyph, the tick and the reviewer's
avatar all say this was not written by the company. Our reviews are three hand
written quotes in a card — the most a visitor can conclude is that we chose
them. `content.rs` even admits this in a comment: a four-star review sits in the
set on purpose, because a perfect wall reads as filtered. An embed makes that
defence unnecessary.

The cost is that it is an embed: third-party script, on a page whose one hard
gate is wasm size and whose one invariant is that the emergency visitor gets
content before any script arrives. So it wants the treatment `ev_lib::analytics`
got — adopt, then measure. Deferred deliberately, not forgotten.
