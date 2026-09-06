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

// The chrome is the design's, not the caller's, so a new language starts here.
#let _labels = (
  en: (direct: "DIRECT", email: "EMAIL", web: "WEB", serving: "SERVING", guarantee: "THE GUARANTEE"),
  fr: (direct: "DIRECT", email: "COURRIEL", web: "SITE", serving: "SECTEUR", guarantee: "NOTRE GARANTIE"),
)

#let _copy-fields = ("role", "hours", "promise", "credentials", "serving", "guarantees")

// -- external interface -------------------------------------------------------

#let card(
  name: none,
  phone: none,
  email: none,
  site: none,
  langs: (:),
) = {
  let fields = (name: name, phone: phone, email: email, site: site)
  for (k, v) in fields {
    assert(type(v) == str and v != "", message: "card." + k + " must be a non-empty string, got " + repr(v))
  }
  assert("en" in langs, message: "card.langs must carry en, the language render() defaults to")
  for (lang, copy) in langs {
    assert(
      lang in _labels,
      message: lang + " has no label set; add one to _labels, available: " + repr(_labels.keys()),
    )
    assert(
      copy.keys().sorted() == _copy-fields.sorted(),
      message: "card.langs." + lang + " must carry exactly " + repr(_copy-fields) + ", got " + repr(copy.keys()),
    )
    for k in _copy-fields.filter(k => k != "guarantees") {
      let v = copy.at(k)
      assert(
        type(v) == str and v != "",
        message: "card.langs." + lang + "." + k + " must be a non-empty string, got " + repr(v),
      )
    }
    // the back's guarantee box is sized by the front's fixed layout, not by content
    assert(
      copy.guarantees.len() == 3,
      message: "the guarantee box fits exactly 3 claims, got " + str(copy.guarantees.len()) + " in " + lang,
    )
  }
  (..fields, langs: langs)
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
#let front(c, lang, trim-guide: false) = {
  let t = c.langs.at(lang)
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
      align(center, _sans(20, weight: "medium", tracking: 3.6, fill: palette.brand-accent, t.promise)),
    ),
  )
  if trim-guide { _trim-guide }
}

// The boxes are transcribed from Figma and cannot grow, so a translation that would
// wrap or run into the guarantee box has to say so rather than render badly.
#let _fits(width, s, body) = context {
  assert(measure(body).width <= width * px, message: repr(s) + " overflows its " + str(width) + "px box")
  body
}

#let _contact-row(label, value) = grid(
  columns: (120 * px, auto),
  column-gutter: 16 * px,
  align: horizon,
  _fits(120, label, _sans(14, weight: "medium", tracking: 1.96, fill: palette.text-secondary, label)), _fits(364, value, _sans(20, weight: "semibold", fill: palette.text-primary, value)),
)

#let back(c, lang, trim-guide: false) = {
  let t = c.langs.at(lang)
  let l = _labels.at(lang)
  set page(fill: palette.bg-base)
  _at(0, 0, rect(width: card-w * px, height: 14 * px, fill: palette.brand-accent))
  _at(97.5, 101.5, _mark(palette.brand-accent, width: 83.136 * px, height: 96 * px))
  _at(97.5, 240, _lh(1.05, 54, _display(54, fill: palette.text-primary, c.name)))
  _at(97.5, 306, _sans(22, fill: palette.text-secondary, t.role))
  _at(
    97.5,
    372,
    stack(
      dir: ttb,
      spacing: 14 * px,
      _contact-row(l.direct, c.phone),
      _contact-row(l.email, c.email),
      _contact-row(l.web, c.site),
      _contact-row(l.serving, t.serving),
    ),
  )
  _at(
    597.5,
    240,
    block(
      width: 430 * px,
      fill: palette.bg-subtle,
      stroke: px + palette.border-default,
      radius: 16 * px,
      inset: (x: 34 * px, top: 32 * px, bottom: 34 * px),
      stack(
        dir: ttb,
        spacing: 18 * px,
        _sans(14, weight: "medium", tracking: 2.52, fill: palette.brand-accent, l.guarantee),
        ..t.guarantees.map(g => grid(
          columns: (16 * px, 1fr),
          column-gutter: 14 * px,
          _sans(18, weight: "semibold", fill: palette.status-success)[✓], _fits(332, g, _lh(1.4, 18, _sans(18, fill: palette.text-primary, g))),
        )),
      ),
    ),
  )
  _at(97.5, 546, rect(width: 930 * px, height: 2 * px, fill: palette.border-default))
  _at(
    97.5,
    572,
    _sans(15, weight: "medium", tracking: 1.5, fill: palette.text-secondary, t.hours + "  ·  " + t.credentials),
  )
  if trim-guide { _trim-guide }
}

#let render(c, lang: "en", trim-guide: false) = {
  assert(lang in c.langs, message: lang + " has no copy on this card, available: " + repr(c.langs.keys()))
  set page(width: card-w * px, height: card-h * px, margin: 0pt)
  set text(top-edge: "ascender", bottom-edge: "descender")
  set par(leading: 0pt, spacing: 0pt)
  front(c, lang, trim-guide: trim-guide)
  pagebreak()
  back(c, lang, trim-guide: trim-guide)
}
