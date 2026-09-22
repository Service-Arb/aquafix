# aquafix
![Lines Of Code](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/valeratrades/b48e6f02c61942200e7d1e3eeabf9bcb/raw/aquafix-loc.json)
<br>
[<img alt="ci errors" src="https://img.shields.io/github/actions/workflow/status/Service-Arb/aquafix/errors.yml?branch=main&style=for-the-badge&style=flat-square&label=errors&labelColor=420d09" height="20">](https://github.com/Service-Arb/aquafix/actions?query=branch%3Amain) <!--NB: Won't find it if repo is private-->
[<img alt="ci warnings" src="https://img.shields.io/github/actions/workflow/status/Service-Arb/aquafix/warnings.yml?branch=main&style=for-the-badge&style=flat-square&label=warnings&labelColor=d16002" height="20">](https://github.com/Service-Arb/aquafix/actions?query=branch%3Amain) <!--NB: Won't find it if repo is private-->

A plumbing business, end to end: a Typst business card and a Next.js landing
site for six points in Clermont-Ferrand and Lyon, both rendering the same brand
and the same facts from `assets/`.

The site publishes what nine jobs actually cost — the thing every competitor
gestures at and none of them commits to — and its quote form is a plain
`<form>` that submits before any JavaScript has loaded, because the visitor it
is built for is standing in water. Section copy traces to graded conversion
evidence in [`docs/refs/sites/`](docs/refs/sites/README.md); the reasoning
behind the structure is in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
<!-- markdownlint-disable -->
<details>
<summary>
<h2>Installation</h2>
</summary>

The repo builds with Nix. Determinate Nix with `lazy-trees = true` is required.

```sh
nix develop
```

This gives you Node 22 (≥ 22.13, for `node:sqlite`), Playwright with its
pinned browsers, Typst and ImageMagick, and writes the generated files —
`.github/workflows/`, `.gitignore`, `.treefmt.toml` and this README — from
`flake.nix`. Edit the flake, not them.

Plain npm works for the app itself:

```sh
npm ci && npm run typecheck && npx eslint . && npx vitest run && npm run build && npm start
```

`vendor/evinvest/*.tgz` are unpublished builds of the EV lib packages
(`@evinvest/uikit`, `marketing`, `analytics`, `i18n`), installed as `file:`
dependencies. They are temporary: before the port merges they are replaced by
the same versions from npm, and the directory goes away.

</details>
<!-- markdownlint-restore -->

## Usage
Start the site:

```sh
nix run .#dev
```

A point is at `http://royat.localhost:59081/fr` (every `*.localhost` resolves
to your machine), the brand page at `http://localhost:59081/fr`.

Run the checks:

```sh
nix run .#test           # tsc, eslint, vitest, build, bundle budget, Playwright
nix run .#size           # first-load JS of a point page against tests/bundle_budget.txt
nix run .#figma-parity   # compares the card with the Figma export
nix flake check          # the hermetic Nix build, and the budget against it
```

The bundle budget is the one hard gate. Raising `tests/bundle_budget.txt` is a
deliberate commit that says why.

Build the server and the container image:

```sh
nix build                # the standalone server
nix build .#container    # OCI image, on Linux
```

The image listens on 59081 and keeps its leads in `/data/leads.db`; `/data` is
the mount. Its non-secret settings come from `deploy/config.nix`. Secrets —
`SMTP_URL`, `SMS_TOKEN`, `POSTHOG_KEY` — come only from the container's
environment. Pushing a `v*` tag builds the image and publishes it to
`ghcr.io/service-arb/aquafix`, which deploys it: `nix run .#publish` makes the
tag.

#### Visual baselines

Screenshot baselines are Linux's, because CI is: a mac rasterises glyphs
differently, so locally the pixel comparison is skipped (`AQUAFIX_SNAPSHOTS=1`
shoots anyway, to look). To refresh them after changing a section:

1. Run the **Visual baselines** workflow on the branch
   (`gh workflow run visual-baselines.yml --ref <branch>`). Before that workflow
   exists on `main`, a CI run of **Errors** on the branch writes any missing
   baseline and publishes the same artifact.
2. `gh run download <run-id> -n visual-snapshots -D tests/e2e/__screenshots__`
3. Look at the images, then commit them alone:
   `test: refresh visual baselines (run <run-id>)`.

On Linux, `nix run .#accept-test` does the same locally; `-- <name>` for a subset.

`nix run .#help` prints the list of commands.

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


<br>

<sup>
	This repository follows <a href="https://github.com/valeratrades/.github/tree/master/best_practices">my best practices</a> and <a href="https://github.com/tigerbeetle/tigerbeetle/blob/main/docs/TIGER_STYLE.md">Tiger Style</a> (except "proper capitalization for acronyms": (VsrState, not VSRState) and formatting). For project's architecture, see <a href="./docs/ARCHITECTURE.md">ARCHITECTURE.md</a>.
</sup>

#### License

<sup>
	Licensed under <a href="LICENSE">Blue Oak 1.0.0</a>
</sup>

<br>

<sub>
	Unless you explicitly state otherwise, any contribution intentionally submitted
for inclusion in this crate by you, as defined in the Apache-2.0 license, shall
be licensed as above, without any additional terms or conditions.
</sub>

