# business_card

Typst port of the [Figma design](https://www.figma.com/design/IcOjAnEPBHnQbMWemVZtgE/Aquafix-%E2%80%94-Brand?node-id=1-47).
Two pages, 3.75×2.25in — a 3.5×2in card plus 0.125in bleed on every side.

```sh
typst compile --ignore-system-fonts --font-path fonts __main__.typ card.pdf
./tests/figma_parity.sh
```

`--ignore-system-fonts` is not optional: the design needs Archivo at `wdth 100`
and three Inter weights, which only the pinned instances in [fonts/](fonts) carry.

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
card(name phone email site)          one person, one number — same in every language
     langs.<lang>(role hours promise  written for a reader, so it is translated
                 credentials serving
                 guarantees)
lib.typ _labels.<lang>              DIRECT / EMAIL / WEB / SERVING / THE GUARANTEE
```

Adding a language means a `langs` entry here and a `_labels` entry in `lib.typ`,
which is where the chrome lives because it belongs to the design, not the caller.

The front holds the lock-up and the promise line; every other field lands on the
back. The lock-up spans 59% of the trim width, which is what keeps it the largest
object on the card — the measured reference set is in
[`docs/refs/cards/`](../docs/refs/cards/README.md).

`--input lang=fr` picks the language, `en` if unset. `--input trim-guide=true`
adds the dashed cut line; leave it off for print.

Everything else is internal: the palette, the mark, and the geometry, which is
transcribed 1:1 from the Figma frame in its own unit (`px`, a 300dpi pixel).
Changing a brand colour means editing `palette`, and the parity test will say so.

## Parity test

`tests/__screenshots__/figma-{front,back}.png` are 300dpi exports of the Figma
frames — the baseline cannot be regenerated locally, it comes from Figma.
`tests/figma_parity.sh` renders both pages and counts pixels that survive a blur,
which drops the antialiasing fringe that two different rasterisers always
disagree on. Failures print the expected / actual / diff paths.

Only `en` has Figma frames. Every other language is checked by rendering it: the
boxes it lands in are fixed, so `lib.typ` asserts each string fits instead of
letting it wrap into its neighbour.
