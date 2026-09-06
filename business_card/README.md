# business_card

Typst port of the [Figma design](https://www.figma.com/design/IcOjAnEPBHnQbMWemVZtgE/Aquafix-%E2%80%94-Brand?node-id=1-47).
Two pages, 3.75×2.25in — a 3.5×2in card plus 0.125in bleed on every side.

```sh
nix build .#card    # $out/{en,fr}.{pdf,vcf} — print-ready, no trim guide
typst compile --root .. --ignore-system-fonts --font-path ../assets/fonts __main__.typ card.pdf
./tests/figma_parity.sh
```

`--ignore-system-fonts` is not optional: the design needs Archivo at `wdth 100`
and three Inter weights, which only the pinned instances in
[`assets/fonts/`](../assets/fonts) carry. `--root ..` is what lets the card reach
them and the shared brand.

The `.vcf` beside each PDF is the same card as vCard 4.0 (RFC 6350) — the format
a phone imports. `flake.nix` writes it from `assets/card.toml`, the file
`__main__.typ` renders, so the printed card and the scanned one cannot disagree.

## Interface

`lib.typ` exposes exactly two things a caller touches.

```
             card(…)  ──▶  validated data  ──▶  render(data)  ──▶  front: lock-up + promise
                                                                   back:  everything else
```

`card()` takes the copy and rejects anything blank, a `langs` set without `en`,
or a guarantee list that is not exactly three claims. `render()` lays one
language out.

```
assets/card.toml  name phone email site   one person, one number — same in every language
                  langs.<lang>            role hours promise credentials serving guarantees
                                          — written for a reader, so it is translated
lib.typ           _labels.<lang>          DIRECT / EMAIL / WEB / SERVING / THE GUARANTEE
```

Adding a language means a `langs` table in `assets/card.toml` and a `_labels`
entry in `lib.typ`, which is where the chrome lives because it belongs to the
design, not the caller. `nix build .#card` picks the languages up from the TOML;
the parity test names them.

The front holds the lock-up and the promise line; every other field lands on the
back. The lock-up spans 59% of the trim width, which is what keeps it the largest
object on the card — the measured reference set is in
[`docs/refs/cards/`](../docs/refs/cards/README.md).

`--input lang=fr` picks the language, `en` if unset. `--input trim-guide=true`
adds the dashed cut line; leave it off for print.

Everything else is internal: the geometry, transcribed 1:1 from the Figma frame in
its own unit (`px`, a 300dpi pixel), and the palette and mark, which come from
[`assets/`](../assets) because the site reads them too. Changing a brand colour is
an edit to `assets/brand.toml`, and the parity test will say so.

## Parity test

`tests/__screenshots__/figma-{front,back}.png` are 300dpi exports of the Figma
frames — the baseline cannot be regenerated locally, it comes from Figma.
`tests/figma_parity.sh` renders both pages and counts pixels that survive a blur,
which drops the antialiasing fringe that two different rasterisers always
disagree on. Failures print the expected / actual / diff paths.

Only `en` has Figma frames. Every other language is checked by rendering it: the
boxes it lands in are fixed, so `lib.typ` asserts each string fits instead of
letting it wrap into its neighbour.
