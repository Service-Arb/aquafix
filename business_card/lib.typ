// Geometry is transcribed 1:1 from the Figma frame, whose unit is a 300dpi pixel.
#let px = 0.24pt
#let bleed = 37.5
#let card-w = 1125
#let card-h = 675

#let palette = (
  bg-base: rgb("#ffffff"),
  bg-subtle: rgb("#f6f8fa"),
  bg-inverse: rgb("#0a2540"),
  brand-accent: rgb("#c2703d"),
  action-bg: rgb("#e08a3c"),
  text-primary: rgb("#051726"),
  text-secondary: rgb("#5a6b7c"),
  text-on-inverse: rgb("#ffffff"),
  text-on-inverse-muted: rgb("#a9bdd1"),
  border-default: rgb("#dce3ea"),
  border-inverse: rgb("#1b3a57"),
  status-success: rgb("#1e9e6a"),
  status-danger: rgb("#d8362a"),
  // brand-accent at the watermark's opacity, pre-composited over bg-inverse
  watermark: rgb("#1a2c3f"),
)
#for (k, v) in palette {
  assert(type(v) == color, message: "palette." + k + " is not a color")
}

#let _mark(fill, width: none, height: none) = image(
  bytes(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 86.6 100'><path fill-rule='evenodd' d='M43.3 0L86.6 25V75L43.3 100L0 75V25L43.3 0ZM43.3 20C48 35.06 63.46 44.02 63.46 56.9C63.46 68.03 54.43 77.06 43.3 77.06C32.17 77.06 23.14 68.03 23.14 56.9C23.14 44.02 38.6 35.06 43.3 20Z' fill='"
      + fill.to-hex()
      + "'/></svg>",
  ),
  format: "svg",
  width: width,
  height: height,
)

#let _at(x, y, body) = place(top + left, dx: x * px, dy: y * px, body)

// Figma centres a single line inside its fixed line box; typst hangs it off the ascender.
#let _lh(factor, size, body) = context {
  let h = factor * size * px
  block(height: h, move(dy: (h - measure(body).height) / 2, body))
}

#let _sans(size, weight: "regular", tracking: 0, fill: none, body) = text(
  font: "Inter",
  size: size * px,
  weight: weight,
  tracking: tracking * px,
  fill: fill,
  body,
)

#let _display(size, tracking: 0, fill: none, body) = text(
  font: "Archivo",
  weight: "bold",
  size: size * px,
  tracking: tracking * px,
  fill: fill,
  body,
)

// -- external interface -------------------------------------------------------

#let guarantee(claim) = {
  assert(type(claim) == str and claim != "", message: "guarantee claim must be a non-empty string")
  claim
}

#let card(
  name: none,
  role: none,
  phone: none,
  email: none,
  site: none,
  hours: none,
  promise: none,
  credentials: none,
  serving: none,
  guarantees: (),
) = {
  let fields = (
    name: name,
    role: role,
    phone: phone,
    email: email,
    site: site,
    hours: hours,
    promise: promise,
    credentials: credentials,
    serving: serving,
  )
  for (k, v) in fields {
    assert(type(v) == str and v != "", message: "card." + k + " must be a non-empty string, got " + repr(v))
  }
  // the back's guarantee box is sized by the front's fixed layout, not by content
  assert(
    guarantees.len() == 3,
    message: "the guarantee box fits exactly 3 claims, got " + str(guarantees.len()),
  )
  (..fields, guarantees: guarantees.map(guarantee))
}

// -- renderers ----------------------------------------------------------------

#let _trim-guide = _at(
  bleed,
  bleed,
  rect(
    width: (card-w - 2 * bleed) * px,
    height: (card-h - 2 * bleed) * px,
    stroke: (
      paint: palette.status-danger.transparentize(50%),
      thickness: px,
      dash: (array: (10 * px, 10 * px)),
    ),
  ),
)

#let _trim-w = card-w - 2 * bleed

// the lock-up spans 59% of the trim width, so it is the largest object on the card
#let front(c, trim-guide: false) = {
  set page(fill: palette.bg-inverse)
  _at(825, -60, _mark(palette.watermark, width: 606.2 * px, height: 700 * px))
  _at(
    bleed,
    232.5,
    box(
      width: _trim-w * px,
      height: 121.93 * px,
      align(
        center + horizon,
        stack(
          dir: ltr,
          spacing: 42.41 * px,
          align(horizon, _mark(palette.brand-accent, width: 105.59 * px, height: 121.93 * px)),
          align(horizon, _display(100.72, tracking: 1.5108, fill: palette.text-on-inverse)[
            AQUA#text(fill: palette.brand-accent)[FIX]
          ]),
        ),
      ),
    ),
  )
  _at(
    bleed,
    418.5,
    box(
      width: _trim-w * px,
      align(center, _sans(20, weight: "medium", tracking: 3.6, fill: palette.brand-accent, c.promise)),
    ),
  )
  if trim-guide { _trim-guide }
}

#let _contact-row(label, value) = grid(
  columns: (120 * px, auto),
  column-gutter: 16 * px,
  align: horizon,
  _sans(14, weight: "medium", tracking: 1.96, fill: palette.text-secondary, label), _sans(20, weight: "semibold", fill: palette.text-primary, value),
)

#let back(c, trim-guide: false) = {
  set page(fill: palette.bg-base)
  _at(0, 0, rect(width: card-w * px, height: 14 * px, fill: palette.brand-accent))
  _at(97.5, 160, _lh(1.05, 54, _display(54, fill: palette.text-primary, c.name)))
  _at(97.5, 226, _sans(22, fill: palette.text-secondary, c.role))
  _at(
    97.5,
    292,
    stack(
      dir: ttb,
      spacing: 14 * px,
      _contact-row("DIRECT", c.phone),
      _contact-row("EMAIL", c.email),
      _contact-row("WEB", c.site),
      _contact-row("SERVING", c.serving),
    ),
  )
  _at(
    597.5,
    160,
    block(
      width: 430 * px,
      fill: palette.bg-subtle,
      stroke: px + palette.border-default,
      radius: 16 * px,
      inset: (x: 34 * px, top: 32 * px, bottom: 34 * px),
      stack(
        dir: ttb,
        spacing: 18 * px,
        _sans(14, weight: "medium", tracking: 2.52, fill: palette.brand-accent)[THE GUARANTEE],
        ..c.guarantees.map(g => grid(
          columns: (16 * px, 1fr),
          column-gutter: 14 * px,
          _sans(18, weight: "semibold", fill: palette.status-success)[✓], _lh(1.4, 18, _sans(18, fill: palette.text-primary, g)),
        )),
      ),
    ),
  )
  _at(97.5, 546, rect(width: 930 * px, height: 2 * px, fill: palette.border-default))
  _at(
    97.5,
    572,
    _sans(15, weight: "medium", tracking: 1.5, fill: palette.text-secondary, c.hours + "  ·  " + c.credentials),
  )
  if trim-guide { _trim-guide }
}

#let render(c, trim-guide: false) = {
  set page(width: card-w * px, height: card-h * px, margin: 0pt)
  set text(top-edge: "ascender", bottom-edge: "descender")
  set par(leading: 0pt, spacing: 0pt)
  front(c, trim-guide: trim-guide)
  pagebreak()
  back(c, trim-guide: trim-guide)
}
