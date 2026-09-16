# namparoofingandexteriors.com

Roofing, not plumbing, and not in the graded set that argued the copy on `bands`.
It is here because it is the clearest published answer to a question the graded
set never asked: **what does the page do with a viewport wider than the frame it
was drawn at?**

Captured 2026-09-16 by rendering at 1440, 1920 and 2560. No `capture.html` — what
matters here is layout at three widths, which a static fetch does not carry.

## What it does that we did not

**Only the media answers the viewport.** The hero is a full-bleed aerial that
fills 100vw at every width. The words sit in a column of roughly 340px pinned to
the left gutter, and that column is the same at 1440 and at 2560. Going from
1440 to 2560 adds 1120px of *photograph* and zero px of text. Nothing rebalances.

Ours did the opposite, and this is the whole diagnosis of "clunky on a large
screen". `--page-max: none` tells every row to fill; the hero's two text columns
are the Figma frame's literal 656 and 480; so all 1120 extra px land on the
photo, and the hero is a different composition at every width — at 1440 there is
no photo at all, at 2560 it is the largest thing on the page. None of the three
is the drawn design. Same cause downstream: at 2560 the price table puts `JOB` at
x=120 and `FLAT PRICE FROM` at x=2000, with 1500px of nothing in between.

**Grade D** — this is a mechanic we can see, whose conversion effect we did not
measure. It is adopted on `quiet` because it survives first-principles reasoning
(a line of text has a readable measure regardless of monitor), not because Nam Pa
converts.

## Word count

~1,150 words of body copy across the whole page, and the hero is ~45 of them:
eyebrow, three-line display, three-line lede, one CTA plus a phone number, four
stats. No form above the fold — the estimate form is a destination, not an
ambush.

Our home page carried ~539 words with ~95 in the hero, and said each of the three
risk reversals twice: once in the hero lede, once as the ticks under it, and the
licence a third time in the proof bar under that. `quiet` cuts to ~270 with ~38
in the hero, and folds the proof bar into a four-figure strip inside the hero's
measure.

## What we did not take

The colour. Nam Pa is near-black and safety orange over warm roof photography;
the ratio of image to ink is the transferable part, not the palette. `quiet`
keeps navy and copper from `assets/brand.toml` unchanged.

The section order. Nam Pa leads with a portfolio grid because a roof is a
considered purchase with a visible result. A burst pipe is neither, so `quiet`
keeps the published price list in the first band under the hero — that remains
the differentiator the graded set says nobody else offers.

## One finding about our own asset

A posed team lineup is the wrong photograph for a full-bleed hero. Nam Pa's is an
environment — an aerial with no subject that demands to be seen — so type can sit
anywhere on it. Ours has nine faces and, across the top third, depot signage
carrying a second wordmark and a second *prix fixe, réparé aujourd'hui*. No scrim
makes a legible sign stop reading, so `quiet` ships `assets/photos/hero-wide.jpg`,
cropped below the signage. The lineup wants to be a crew band, not a hero.

What this hero actually wants is a wide environmental shot: a van on a
Clermont-Ferrand street, or a plumber at a door. That is a photography brief, not
a layout fix.
