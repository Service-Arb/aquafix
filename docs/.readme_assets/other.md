## Layout

```text
app/             Next routes: pages under [locale]/[location], /quote, /og, /health
src/             the site in Feature-Sliced layers (shared → entities → features → widgets → views)
assets/          brand.toml, card.toml, mark.svg, fonts/, photos — the brand, written once
brand_materials/ the Typst card and the A4 door sheet
tests/           vitest; tests/e2e/ Playwright; bundle_budget.txt
docs/refs/       graded conversion evidence the copy is argued from
deploy/          production config, authored in Nix
nix/             the generated CI workflows' source
vendor/evinvest/ temporary tarballs of the unpublished EV lib packages
```
