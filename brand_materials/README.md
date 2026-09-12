# brand_materials

Everything Aquafix prints, as a Typst port of the [Figma design](https://www.figma.com/design/IcOjAnEPBHnQbMWemVZtgE/Aquafix-%E2%80%94-Brand).

| material | page | for |
|---|---|---|
| `card` | 2 × 3.75×2.25in — a 3.5×2in card plus 0.125in bleed on every side | a print shop |
| `sheet` | 1 × A4 landscape, no bleed | the office printer: a door, a van, a meter cupboard |

```sh
nix build .#brand-materials    # $out/<lang>-{card,sheet}.pdf + <lang>.vcf
typst compile --root .. --ignore-system-fonts --font-path ../assets/fonts \
  --input material=sheet __main__.typ sheet.pdf
./tests/figma_parity.sh
```

`--ignore-system-fonts` is not optional: the design needs Archivo at `wdth 100`
and three Inter weights, which only the pinned instances in
[`assets/fonts/`](../assets/fonts) carry. `--root ..` is what lets the materials
reach them and the shared brand.

The `.vcf` is the card as vCard 4.0 (RFC 6350) — the format a phone imports.
`flake.nix` writes it from `assets/card.toml`, the file `__main__.typ` renders, so
the printed card and the scanned one cannot disagree.

## Interface

`lib.typ` exposes exactly two things a caller touches.

```
                            ┌──▶ card:  front — lock-up + promise
  card(…) ──▶ validated ──▶ render(…) ──┤       back  — everything else
              data          material    └──▶ sheet: lock-up + trade + promise
```

`card()` takes the copy and rejects anything blank, a `langs` set without `en`,
or a guarantee list that is not exactly three claims. `render()` lays one
language out as one material.

```
assets/card.toml  name phone email site   one person, one number — same in every language
                  langs.<lang>            role hours promise trade credentials serving
                                          guarantees — written for a reader, so it is translated
lib.typ           _labels.<lang>          DIRECT / EMAIL / WEB / SERVING / THE GUARANTEE
```

Adding a language means a `langs` table in `assets/card.toml` and a `_labels`
entry in `lib.typ`, which is where the chrome lives because it belongs to the
design, not the caller. `nix build .#brand-materials` picks the languages up from
the TOML; the parity test names them.

`_lockup(k, ink)` is the one object both materials draw, `k` times the geometry
the Figma card frame fixed — the card at 1, the sheet at 4.5. The wordmark's two
halves come from `brand.wordmark`.

The card's front holds the lock-up and the promise line; every other field lands
on the back. The lock-up spans 59% of the trim width, which is what keeps it the
largest object on the card — the measured reference set is in
[`docs/refs/cards/`](../docs/refs/cards/README.md).

The sheet carries no contact details. It is read from a corridor, so it says who
this is, what trade, and the promise, with the lock-up over 80% of the paper. It
is the light scope while the card's front is navy: an office printer leaves a
white margin whether the design wants one or not.

`--input lang=fr` picks the language, `en` if unset; `--input material=sheet`
picks the material, `card` if unset. `--input trim-guide=true` adds the dashed
cut line to the card; leave it off for print.

Everything else is internal: the geometry, transcribed 1:1 from the Figma frames
in its own unit (`px`, a 300dpi pixel), and the palette and mark, which come from
[`assets/`](../assets) because the site reads them too. Changing a brand colour is
an edit to `assets/brand.toml`, and the parity test will say so.

## Parity test

`tests/__screenshots__/figma-{front,back,sheet}.png` are 300dpi exports of the
Figma frames — the baseline cannot be regenerated locally, it comes from Figma.
`tests/figma_parity.sh` renders every page and counts pixels that survive a blur,
which drops the antialiasing fringe that two different rasterisers always
disagree on. Failures print the expected / actual / diff paths.

Only `en` has Figma frames. Every other language is checked by rendering it: the
boxes it lands in are fixed, so `lib.typ` asserts each string fits instead of
letting it wrap into its neighbour.
