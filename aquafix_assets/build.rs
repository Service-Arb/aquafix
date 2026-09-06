//! Derives `aquafix/assets/` from the repo-root `assets/`, at build time.
//!
//! Lives in its own crate rather than in `aquafix/build.rs`, which v_flakes
//! generates and overwrites on every `nix develop`. As a build-dependency of
//! `aquafix`, this script is ordered before that crate compiles, which is what
//! `asset!()` needs.
//!
//! `asset!()` cannot reference a path outside its own crate, so the brand files
//! the business card also renders from have to be staged in. Doing it from
//! `build.rs` — rather than a command the flake remembers to run — is what
//! makes `aquafix/assets/` a derived, gitignored directory instead of a second
//! copy that drifts.
//!
//! Tailwind runs from here too, rather than from a build step beside cargo. It
//! has to: `input.css` imports the `tokens.css` written below, so the two are
//! ordered, and `asset!()` needs the stylesheet on disk by the time the crate
//! compiles. Doing both in one place makes that ordering structural instead of
//! something three call sites have to agree on.

use std::{collections::BTreeMap, path::Path};

fn main() {
	stage();
}

/// brand.toml colour key → the Tailwind colour name it is reachable as.
///
/// Not mechanical: stripping the Figma category prefix collides (`bg/inverse`
/// and `border/inverse` both reduce to `inverse`) and Tailwind shares one
/// colour namespace across `bg-` / `text-` / `border-`. So the names are chosen
/// once, here, and the build fails if brand.toml and this list disagree.
const NAMES: &[(&str, &str)] = &[
	("bg-base", "surface"),
	("bg-subtle", "subtle"),
	("bg-mist", "mist"),
	("bg-inverse", "inverse"),
	("bg-inverse-raised", "inverse-raised"),
	("bg-inverse-deep", "inverse-deep"),
	("brand-primary", "brand"),
	("brand-accent", "accent"),
	("action-bg", "action"),
	("action-text", "on-action"),
	// darkest → lightest, which Figma's primary/secondary/tertiary does not say
	("text-primary", "ink"),
	("text-tertiary", "ink-mid"),
	("text-secondary", "ink-soft"),
	("text-on-inverse", "on-inverse"),
	("text-on-inverse-muted", "on-inverse-muted"),
	("border-default", "rule"),
	("border-inverse", "rule-inverse"),
	("status-success", "success"),
	("status-danger", "danger"),
];

/// Print-only: brand-accent pre-composited over bg-inverse, because paper has
/// no alpha. The web watermark is a real alpha fill, so no token is emitted.
const PRINT_ONLY: &[&str] = &["watermark"];

/// The webfaces the site `@font-face`s. The `.ttf` twins stay behind — they are
/// typst's, and shipping them to a browser would double the font payload.
const FACES: &[&str] = &[
	"Archivo-SemiBold.woff2",
	"Archivo-Bold.woff2",
	"Inter-Regular.woff2",
	"Inter-Medium.woff2",
	"Inter-SemiBold.woff2",
];

fn stage() {
	let repo = Path::new(env!("CARGO_MANIFEST_DIR")).parent().expect("crate is one level under the repo root").to_path_buf();
	let shared = repo.join("assets");
	// The site crate's own assets dir: `asset!()` cannot reach outside it.
	let site = repo.join("aquafix");
	let out = site.join("assets");

	println!("cargo:rerun-if-changed={}", shared.display());

	std::fs::create_dir_all(out.join("fonts")).expect("create aquafix/assets/fonts");
	for face in FACES {
		std::fs::copy(shared.join("fonts").join(face), out.join("fonts").join(face)).unwrap_or_else(|e| panic!("stage {face}: {e}"));
	}

	std::fs::write(
		out.join("tokens.css"),
		tokens_css(&std::fs::read_to_string(shared.join("brand.toml")).expect("assets/brand.toml")),
	)
	.expect("write tokens.css");

	// Class literals live in the RSX, so the stylesheet is a function of the
	// sources — rerun on both.
	println!("cargo:rerun-if-changed={}", site.join("input.css").display());
	println!("cargo:rerun-if-changed={}", site.join("src").display());
	let tailwind = std::process::Command::new("tailwindcss")
		.args(["-i", "./input.css", "-o", "./assets/tailwind.css"])
		.current_dir(&site)
		.status()
		.expect("tailwindcss on PATH — enter `nix develop`, or build through the flake");
	assert!(tailwind.success(), "tailwindcss failed");
}

fn tokens_css(brand: &str) -> String {
	let brand: BrandToml = toml::from_str(brand).expect("brand.toml parses");

	let unnamed: Vec<_> = brand
		.colors
		.keys()
		.filter(|k| !PRINT_ONLY.contains(&k.as_str()) && !NAMES.iter().any(|(from, _)| from == k))
		.collect();
	assert!(unnamed.is_empty(), "brand.toml colours with no Tailwind name in NAMES: {unnamed:?}");

	let mut theme = String::new();
	let mut root = String::new();
	for (key, name) in NAMES {
		let value = brand.colors.get(*key).unwrap_or_else(|| panic!("NAMES references a colour brand.toml does not have: {key}"));
		theme.push_str(&format!("  --color-{name}: var(--{name});\n"));
		root.push_str(&format!("  --{name}: {value};\n"));
	}

	format!(
		"/* GENERATED from assets/brand.toml by aquafix/assets.rs. Do not edit.\n\
		 *\n\
		 * `@theme inline` wires the values into Tailwind utilities; `:root` carries the\n\
		 * raw custom properties, so an arbitrary `bg-[var(--inverse)]` also resolves. */\n\
		 \n\
		 @theme inline {{\n\
		 {theme}\n\
		 \x20 --font-display: \"{display}\", ui-sans-serif, system-ui, sans-serif;\n\
		 \x20 --font-text: \"{text}\", ui-sans-serif, system-ui, sans-serif;\n\
		 }}\n\
		 \n\
		 :root {{\n\
		 {root}\
		 }}\n",
		display = brand.fonts.display,
		text = brand.fonts.text,
	)
}

#[derive(serde::Deserialize)]
struct BrandToml {
	colors: BTreeMap<String, String>,
	fonts: FontsToml,
}

#[derive(serde::Deserialize)]
struct FontsToml {
	display: String,
	text: String,
}
