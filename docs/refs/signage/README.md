# Reference signage — how big does each line on the A4 sheet have to be?

Collected to answer one question: **the sheet marks a door, so from how far away does
each line on it have to be readable?** Same grading scheme as
[`../sites/README.md`](../sites/README.md).

| Grade | Means |
|---|---|
| **A** | Published, checkable, and derivable from first principles — a formula, not an opinion |
| **B** | Sign-trade rule of thumb, repeated by independent fabricators |
| **C** | A single vendor's chart |
| **D** | Our inference |

---

## The measurement

Legibility is an angle, not a size. For viewing distance `D` in feet and a target visual
angle `θ` in arcminutes:

```
cap height (in) = D × θ ÷ 286.5
```

Two thresholds are in use, and the gap between them is why published charts disagree by
2.5×. Grade **A** — both are the same formula at different `θ`:

| θ | ft per inch of cap | what it buys |
|---|---|---|
| 11.46′ | 25 | "decodable if you stop and look" |
| 28.65′ | 10 | "instant, in motion, in poor light" |

A reader at a door is stationary and motivated, so the sheet is specified at **11.46′**.
A van, read from moving traffic, would be specified at 28.65′ and is a different artefact.

Cap height is not point size. Measured from the shipped instances in
[`assets/fonts/`](../../../assets/fonts): Archivo **0.686 em**, Inter **0.7275 em**.

## What the sheet scores

At 300dpi, `cap in = px × ratio ÷ 300`.

| line | px | cap (in) | legible to |
|---|---|---|---|
| `wordmark` | 453.24 | 1.04 | **7.9 m** |
| `phone` | 200 | 0.46 | **3.5 m** |
| `trade` | 108 | 0.26 | **2.0 m** |
| `promise` | 90 | 0.22 | **1.7 m** |
| `site` | 90 | 0.22 | **1.7 m** |
| `territory` | 76 | 0.18 | **1.4 m** |

Three distances, and each line is in one of them: the lock-up is read from the corridor,
the number from across the room, everything else standing at the door. A line that lands
between two of them is the one that looks unbalanced.

## What it decided

- `site` sits at the promise's size, not below it. Under 90px it drops beneath the
  standing-read distance and becomes the only line on the sheet you have to step up to.
- `phone` at 200px stays under the wordmark's width, which is the card's property too
  ([`../cards/`](../cards/README.md)) — the lock-up is the largest object on the artefact.
- `territory` is chrome. It is the one line specified below the door distance, because it
  is read once to confirm you have the right trade and the right city, not in an emergency.

## Sources

- [Sign letter height by viewing distance](https://www.digitalpolo.com/sign-letter-height-viewing-distance/) — the formula and both thresholds · **A**
- [Typography and readability for fleet graphics](https://www.craftsmenind.com/blog/fleet-graphics-typography-readability) — 3–6in minimum for street-level primary messaging, phone numbers permitted smaller · **B**
- [Tips to ensure legible vehicle lettering](https://www.speedpro.com/blog/tips-legible-vehicle-lettering-graphics/) · **C**
