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

`card()` takes the copy — `name`, `role`, `phone`, `email`, `site`, `hours`,
`promise`, `credentials`, `serving`, `guarantees` — and rejects anything blank
or a guarantee list that is not exactly three claims. `render()` lays it out.

The front holds the lock-up and the promise line; every other field lands on the
back. The lock-up spans 59% of the trim width, which is what keeps it the largest
object on the card — the measured reference set is in
[`docs/refs/cards/`](../docs/refs/cards/README.md).

`--input back-mark=true` sets the copper mark above the name and drops the
information block 80px to clear it. `--input trim-guide=true` adds the dashed cut
line; leave it off for print.

Everything else is internal: the palette, the mark, and the geometry, which is
transcribed 1:1 from the Figma frame in its own unit (`px`, a 300dpi pixel).
Changing a brand colour means editing `palette`, and the parity test will say so.

## Parity test

`tests/__screenshots__/figma-{front,back,back-marked}.png` are 300dpi exports of
the Figma frames — the baseline cannot be regenerated locally, it comes from
Figma. `tests/figma_parity.sh` renders both back variants and counts pixels that
survive a blur, which drops the antialiasing fringe that two different
rasterisers always disagree on. Failures print the expected / actual / diff paths.
