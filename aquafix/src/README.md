# aquafix — the site

A Dioxus fullstack landing funnel. One page, one action; every other page exists
to answer an objection that would otherwise stop that action.

## The rules this crate obeys

- **Copper is CTA-only.** `action/bg` (`bg-action`) appears on calls to action
  and nowhere else, so the eye can always find the next step. `brand/accent`
  (`text-accent`) is the eyebrow and price colour and is a *different* value on
  purpose.
- **Sections take typed data, and a `Lang`.** A `sections/*` function receives
  its slice of `content` and nothing else. There is no literal copy inside an
  `rsx!`. This is what makes a price row render *and* emit its `Offer` from one
  value. `lang` is required, never defaulted below a page: a section that
  forgets to thread it is a compile error, not an English patch inside a French
  page. Every internal `href` goes through `lang.href(...)`.
- **Layout classes live only in `blocks.rs`.** Section padding, panel width, the
  corner ladder, the eyebrow treatment and the display type scale appear in
  exactly one file. A section that writes its own `py-` has broken the contract;
  one that writes its own `px-` instead of `PANEL` puts its content on a
  different vertical from every other section's; one that writes its own
  `rounded-` breaks the 30 → 20 → 14 nesting.
- **Nothing paints to the viewport edge.** The page is white and a section is a
  panel on it — `STACK` is the field and the air between panels, `PANEL` is the
  box. The proportion is `hyros.com`'s, measured; `docs/refs/sites/hyros/NOTES.md`
  has the table.
- **The no-JS form path is not optional.** The quote form is a real
  `<form method="post" action="/quote">`. It must keep working before the wasm
  loads, because that is when the visitor we care about most submits it.
- **Nothing in `seo` or `ld` restates a string `content` owns.** A description
  is one field read three times.

## What lives where

```text
content.rs   every fact once; every string once per Lang (EN / FR)
blocks.rs    STACK/PANEL/CARD/TILE/Section/Tone/SectionHead/Head/Prose/CtaButton/PhoneLink/Pill/StatRow/LangSwitch
brand.rs     the mark, the wordmark, the @font-face block — all from assets/
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

`ev_lib` is not used. Its `uikit` is shadcn-shaped around the EV palette, and
its `analytics` — right on shape — costs 236 KB of wasm because it POSTs through
`reqwest`. Both decisions, with the numbers, are in `docs/ARCHITECTURE.md`.

Where a native element does the job, it is used: `<details>` for the FAQ and the
mobile drawer, a real `<table>` for the price list, a real `<form>` for the
quote. Less to hydrate is both faster and less to test.
