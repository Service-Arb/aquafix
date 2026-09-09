# aquafix — the site

A Dioxus fullstack landing funnel. One page, one action; every other page exists
to answer an objection that would otherwise stop that action.

## The rules this crate obeys

- **Copper is the action.** `primary` is the call to action, the eyebrow and the
  price. One value, authored to be legible as both a fill and as text — where it
  fills, `on-primary` says what reads on it.
- **Sections take typed data, and a `Lang`.** A `sections/*` function receives
  its slice of `content` and nothing else. There is no literal copy inside an
  `rsx!`. This is what makes a price row render *and* emit its `Offer` from one
  value. `lang` is required, never defaulted below a page: a section that
  forgets to thread it is a compile error, not an English patch inside a French
  page. Every internal `href` goes through `lang.href(...)`.
- **Layout is a token, not a class.** Band rhythm is `--band-py`, the gutter
  `--page-px`, the headline scale `--display-scale`, the CTA's shape
  `--control-*`. They are written once in `input.css`; a section that writes its
  own `py-` has broken the contract.
- **Polarity is a scope, not a prop.** `<Section polarity=…>` puts `light` or
  `dark` on the band, and custom properties inherit — so `text-ink`,
  `text-ink-soft` and `border-border` are correct inside either, and nothing has
  to be told which side it is on. A light island inside a dark band (the hero's
  quote card) says `light` on itself.
- **The no-JS form path is not optional.** The quote form is a real
  `<form method="post" action="/quote">`. It must keep working before the wasm
  loads, because that is when the visitor we care about most submits it.
- **Nothing in `seo` or `ld` restates a string `content` owns.** A description
  is one field read three times.

## What lives where

```text
content.rs   every fact once; every string once per Lang (EN / FR)
brand.rs     the mark, the wordmark, the @font-face block, the CTA face — from assets/
sections/    one file per Figma frame, ≤120 lines
pages.rs     the Route enum (each page at /x and /:lang/x) and the four compositions
l10n.rs      which language a request gets (server-only)
seo.rs       per-route <head>, hreflang cluster, robots.txt, sitemap.xml
ld.rs        the schema.org @graph, derived from content
quote.rs     the form, its no-JS POST target and its server fn
store.rs     lead persistence (server-only); the commit point of the funnel
status.rs    404/403/500/thanks over one StatusCopy
analytics.rs PostHog capture, wrapped so no section writes a cfg
```

## Constraints from below

The layout vocabulary — `Section`, `SectionHead`, `Display`, `Prose`, `Stat`,
`Check` — and the controls come from `ev_lib::uikit` on its `modern` token
feature. `assets/brand.toml` fills the kit's names with this brand's values, in
two scopes; nothing here overrides a kit class to get a colour.

`ev_lib::analytics` is not used: right on shape, but it POSTs through `reqwest`,
which costs 236 KB of wasm. The number is in `docs/ARCHITECTURE.md`.

Where a native element does the job, it wins over the kit: `<details>` for the
FAQ and the mobile drawer, a native `<select>` in the quote form (the kit's is a
`div` combobox, and this form submits before any wasm), a plain `<label>`
wrapping its input (the kit's `Field` needs a `FormControl` to mint an id, and
without one its label emits an empty `for`). Less to hydrate is both faster and
less to test — and it is the invariant that outranks reuse.
