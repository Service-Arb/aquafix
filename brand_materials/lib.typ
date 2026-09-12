// Geometry is transcribed 1:1 from the Figma frame, whose unit is a 300dpi pixel.
#let px = 0.24pt
#let bleed = 37.5
#let card-w = 1125
#let card-h = 675

// Shared with the site; compile with `--root ..` so these escape brand_materials/.
#let brand = toml("../assets/brand.toml")
// The card is one polarity per face, so it reads the two scopes directly; the
// watermark is print-only, pre-composited because paper has no alpha.
#let palette = {
  let d = (light: (:), dark: (:))
  for (scope, cols) in brand.colors {
    for (k, v) in cols { d.at(scope).insert(k, rgb(v)) }
  }
  d.insert("watermark", rgb(brand.print.watermark))
  d
}

// typst does not resolve `currentColor`, so the shared mark is re-fill()ed here.
#let _mark-src = read("../assets/mark.svg")
#let _mark(fill, width: none, height: none) = image(
  bytes(_mark-src.replace("currentColor", fill.to-hex())),
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
  font: brand.fonts.text,
  size: size * px,
  weight: weight,
  tracking: tracking * px,
  fill: fill,
  body,
)

#let _display(size, tracking: 0, fill: none, body) = text(
  font: brand.fonts.display,
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

#let _copy-fields = ("role", "hours", "promise", "trade", "credentials", "serving", "guarantees")

// The lock-up is the one object both materials render, at whatever scale the
// medium gives it; `k` multiplies the geometry the Figma card frame fixed.
#let _lockup(k, ink) = stack(
  dir: ltr,
  spacing: 42.41 * k * px,
  align(horizon, _mark(palette.light.primary, width: 105.59 * k * px, height: 121.93 * k * px)),
  align(horizon, _display(100.72 * k, tracking: 1.5108 * k, fill: ink)[
    #brand.wordmark.first()#text(fill: palette.light.primary, brand.wordmark.last())
  ]),
)

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
      paint: palette.light.accent-error.transparentize(50%),
      thickness: px,
      dash: (array: (10 * px, 10 * px)),
    ),
  ),
)

#let _trim-w = card-w - 2 * bleed

// the lock-up spans 59% of the trim width, so it is the largest object on the card
#let front(c, lang, trim-guide: false) = {
  let t = c.langs.at(lang)
  set page(fill: palette.dark.card)
  _at(825, -60, _mark(palette.watermark, width: 606.2 * px, height: 700 * px))
  _at(
    bleed,
    232.5,
    box(
      width: _trim-w * px,
      height: 121.93 * px,
      align(center + horizon, _lockup(1, palette.dark.ink)),
    ),
  )
  _at(
    bleed,
    418.5,
    box(
      width: _trim-w * px,
      align(center, _sans(20, weight: "medium", tracking: 3.6, fill: palette.light.primary, t.promise)),
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
  _fits(120, label, _sans(14, weight: "medium", tracking: 1.96, fill: palette.light.ink-soft, label)), _fits(364, value, _sans(20, weight: "semibold", fill: palette.light.ink, value)),
)

#let back(c, lang, trim-guide: false) = {
  let t = c.langs.at(lang)
  let l = _labels.at(lang)
  set page(fill: palette.light.background)
  _at(0, 0, rect(width: card-w * px, height: 14 * px, fill: palette.light.primary))
  _at(97.5, 101.5, _mark(palette.light.primary, width: 83.136 * px, height: 96 * px))
  _at(97.5, 240, _lh(1.05, 54, _display(54, fill: palette.light.ink, c.name)))
  _at(97.5, 306, _sans(22, fill: palette.light.ink-soft, t.role))
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
      fill: palette.light.card,
      stroke: px + palette.light.border,
      radius: 16 * px,
      inset: (x: 34 * px, top: 32 * px, bottom: 34 * px),
      stack(
        dir: ttb,
        spacing: 18 * px,
        _sans(14, weight: "medium", tracking: 2.52, fill: palette.light.primary, l.guarantee),
        ..t.guarantees.map(g => grid(
          columns: (16 * px, 1fr),
          column-gutter: 14 * px,
          _sans(18, weight: "semibold", fill: palette.light.positive)[✓], _fits(332, g, _lh(1.4, 18, _sans(18, fill: palette.light.ink, g))),
        )),
      ),
    ),
  )
  _at(97.5, 546, rect(width: 930 * px, height: 2 * px, fill: palette.light.border))
  _at(
    97.5,
    572,
    _sans(15, weight: "medium", tracking: 1.5, fill: palette.light.ink-soft, t.hours + "  ·  " + t.credentials),
  )
  if trim-guide { _trim-guide }
}

// A4, landscape, no bleed — it prints on whatever is in the office. Every colour
// is the scope's, so the two cuts are one layout: light is paper, and dark is the
// card's front at A4, down to the surface and the watermark.
#let sheet(c, lang, polarity) = {
  let t = c.langs.at(lang)
  let s = palette.at(polarity)
  let k = 4.5 // the lock-up spans 80% of the sheet, the one object read from a corridor
  set page(
    paper: "a4",
    flipped: true,
    margin: 0pt,
    fill: if polarity == "dark" { s.card } else { s.background },
  )
  if polarity == "dark" { _at(2236, -220, _mark(palette.watermark, width: 2227.2 * px, height: 2571.8 * px)) }
  place(center + horizon, block(width: 100%, {
    align(center, _lockup(k, s.ink))
    v(150 * px)
    align(center, box(width: 2900 * px, grid(
      columns: (1fr, auto, 1fr),
      column-gutter: 80 * px,
      align: horizon,
      line(length: 100%, stroke: 4 * px + s.ink-soft),
      // leaves each rule at least 200px, below which the row stops reading as a lock-up
      _fits(2340, t.trade, _sans(24 * k, weight: "semibold", tracking: 2.6 * k, fill: s.ink-mid, t.trade)), line(length: 100%, stroke: 4 * px + s.ink-soft),
    )))
    v(120 * px)
    align(center, _sans(20 * k, weight: "medium", tracking: 3.6 * k, fill: palette.light.primary, t.promise))
  }))
}

#let _materials = ("card", "sheet")
#let _polarities = ("light", "dark")

#let render(c, lang: "en", material: "card", polarity: "light", trim-guide: false) = {
  assert(lang in c.langs, message: lang + " has no copy here, available: " + repr(c.langs.keys()))
  assert(material in _materials, message: material + " is not a material, available: " + repr(_materials))
  assert(polarity in _polarities, message: polarity + " is not a polarity, available: " + repr(_polarities))
  assert(not trim-guide or material == "card", message: "only the card is printed with bleed, so only it has a trim")
  assert(
    polarity == "light" or material == "sheet",
    message: "the card is one polarity per face, so only the sheet is cut both ways",
  )
  set text(top-edge: "ascender", bottom-edge: "descender")
  set par(leading: 0pt, spacing: 0pt)
  if material == "sheet" {
    sheet(c, lang, polarity)
  } else {
    set page(width: card-w * px, height: card-h * px, margin: 0pt)
    front(c, lang, trim-guide: trim-guide)
    pagebreak()
    back(c, lang, trim-guide: trim-guide)
  }
}
