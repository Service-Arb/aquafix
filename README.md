# aquafix
![Minimum Supported Rust Version](https://img.shields.io/badge/nightly-1.100+-ab6000.svg)
[<img alt="crates.io" src="https://img.shields.io/crates/v/aquafix.svg?color=fc8d62&logo=rust" height="20" style=flat-square>](https://crates.io/crates/aquafix)
[<img alt="docs.rs" src="https://img.shields.io/badge/docs.rs-66c2a5?style=for-the-badge&labelColor=555555&logo=docs.rs&style=flat-square" height="20">](https://docs.rs/aquafix)
![Lines Of Code](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/valeratrades/b48e6f02c61942200e7d1e3eeabf9bcb/raw/aquafix-loc.json)
<br>
[<img alt="ci errors" src="https://img.shields.io/github/actions/workflow/status/@@REPO_SLUG@@/errors.yml?branch=main&style=for-the-badge&style=flat-square&label=errors&labelColor=420d09" height="20">](https://github.com/@@REPO_SLUG@@/actions?query=branch%3Amain) <!--NB: Won't find it if repo is private-->
[<img alt="ci warnings" src="https://img.shields.io/github/actions/workflow/status/@@REPO_SLUG@@/warnings.yml?branch=main&style=for-the-badge&style=flat-square&label=warnings&labelColor=d16002" height="20">](https://github.com/@@REPO_SLUG@@/actions?query=branch%3Amain) <!--NB: Won't find it if repo is private-->

A plumbing business, end to end: a Typst business card and a Dioxus fullstack
landing funnel, both rendering the same brand and the same facts from
`assets/`.

The site publishes what nine jobs actually cost — the thing every competitor
gestures at and none of them commits to — and its quote form submits before any
WebAssembly has loaded, because the visitor it is built for is standing in
water. Section copy traces to graded conversion evidence in
[`docs/refs/sites/`](docs/refs/sites/README.md); the reasoning behind the
structure is in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
<!-- markdownlint-disable -->
<details>
<summary>
<h2>Installation</h2>
</summary>

The repo builds with Nix. Determinate Nix with `lazy-trees = true` is required.

```sh
nix develop
```

This gives you the Rust toolchain, `dx`, the Tailwind CLI, Typst and
ImageMagick. The build derives everything under `aquafix/assets/` from
`assets/`, so there is no separate asset step.

</details>
<!-- markdownlint-restore -->

## Usage
Start the site:

```sh
nix run .#dev
```

The page is at `http://127.0.0.1:59081`.

Run the checks:

```sh
nix run .#test           # HTML snapshots, then screenshots at both breakpoints
nix run .#size           # WebAssembly size against the committed budget
nix run .#figma-parity   # compares the card with the Figma export
```

Accept new baselines after you change a section:

```sh
nix run .#accept-test
```

Build the release server and the container image:

```sh
nix build .#dx
nix build .#container
```

`nix run .#help` prints this list.

## Layout

```text
assets/          brand.toml, mark.svg, fonts/ — the brand, written once
business_card/   the Typst card
aquafix/         the site (see aquafix/src/README.md for local conventions)
docs/refs/       graded conversion evidence the copy is argued from
deploy/          production config, authored in Nix
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

