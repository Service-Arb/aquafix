# hyros.com — the density benchmark

**Why it is in the set:** named directly in the brief. Not a plumbing site; it is here for
page *shape*, not content.

**Verified proof on page (grade A/B):**
- "Tracking **$5B+ in ad spend** for **Tony Robbins**, **Alex Hormozi**, **Whop** & 5,000+ more"
- H1: "Get **15%+ more customers** from the same ad spend. **Or you don't pay.**"
- "Set up in minutes — guaranteed results, or you don't pay"
- Stat block: 15–20% ROI boost, 10–15% CPA reduction, 10% AOV increase

## The mechanic

The risk reversal lives **inside the headline**, not in a badge below it. The offer and the
guarantee are one sentence. Proof (named clients + dollar volume) lands immediately after,
before any feature is described.

Order: **promise → guarantee → proof → segmented use case → CTA.** Features come last or
never. There is no hero illustration doing decorative work.

## Taken

- H1 carries the guarantee: *"Your plumbing fixed today — at a price we agree before we start."*
- Proof bar immediately under the hero (Google / Yelp / BBB / licence / insurance), same position as Hyros' client logo row.
- Named, quantified stats rather than adjectives — `43 min average arrival`, `96% fixed same day`, `4,100 jobs since 2011`.
- **The page geometry.** Measured off the live site at nine viewport widths:

  | | 1920 | 1440 | 1280 | 1024 | 768 | 390 |
  |---|---|---|---|---|---|---|
  | panel width | 1220 | 1220 | 1204 | 948 | 692 | 314 |
  | page gutter | 350 | 110 | 38 | 38 | 38 | 38 |
  | panel padding | 48 | 48 | 48 | 38 | 28 | 18 |
  | h1 | 62 | 62 | 57 | 45 | 33 | 27 |

  A panel is `min(cap, 100vw − 2·gutter)`, radius 30 desktop / 26 mobile, and the
  page behind it is white — nothing paints to the viewport edge. Radii step
  30 → 24 → 16 as boxes nest; every button is a pill. Text inside a panel keeps
  its own measure (h1 900, body 560), which is why a wide panel never produces a
  wide line.

  Taken exactly, so the table above is also ours: `blocks::PANEL` is
  `min(1220, 100vw - 76)`. That gives a 1124 content column rather than the
  Figma frame's 1200 — where the reference and the frame disagreed on desktop
  width, the reference won. Below the `md` seam the numbers are ours, not
  Hyros': the panel there is tuned to put the quote form's submit button above
  the fold on a 360-wide phone, which costs horizontal room Hyros does not
  need to spend.

## Rejected

- The airy above-fold. Correct for considered B2B, wrong for a homeowner in an emergency.
  Our hero is denser and puts the quote form *in* the fold rather than behind a CTA click.
  This survives the geometry above: the panel changed, what is inside it did not.
- The serif display face. Hyros sets its headlines in P22 Mackinac, which is a large part
  of why the page reads expensive. Aquafix's is Archivo, and the typeface is a brand
  decision rather than a proportion one, so it was left alone.
- The segmented "choose your business type" selector — one audience, one path.
