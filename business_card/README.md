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
             card(…)  ──▶  validated data  ──▶  render(data)  ──▶  front page
                                                                   back page
```

`card()` takes the copy — `name`, `role`, `phone`, `email`, `site`, `hours`,
`promise`, `credentials`, `serving`, `guarantees` — and rejects anything blank
or a guarantee list that is not exactly three claims. `render()` lays it out.
`--input trim-guide=true` adds the dashed cut line; leave it off for print.

Everything else is internal: the palette, the mark, and the geometry, which is
transcribed 1:1 from the Figma frame in its own unit (`px`, a 300dpi pixel).
Changing a brand colour means editing `palette`, and the parity test will say so.

## Parity test

`tests/__screenshots__/figma-{front,back}.png` are 300dpi exports of the two
Figma frames — the baseline cannot be regenerated locally, it comes from Figma.
`tests/figma_parity.sh` renders both pages and counts pixels that survive a
blur, which drops the antialiasing fringe that two different rasterisers always
disagree on. Failures print the expected / actual / diff paths.
