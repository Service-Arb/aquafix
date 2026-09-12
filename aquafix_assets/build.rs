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

/// Every colour token the kit's class tables reference. Both scopes must carry
/// all of them: a hole is a band with no colour for something, and Tailwind
/// answers an undefined token by emitting no rule at all — silently. So the
/// contract is asserted here rather than discovered on the page.
const TOKENS: &[&str] = &[
	"background",
	"card",
	"popover",
	"muted",
	"hover",
	"ink",
	"ink-mid",
	"ink-soft",
	"border",
	"input",
	"ring",
	"brand",
	"primary",
	"on-primary",
	"secondary",
	"on-secondary",
	"positive",
	"on-positive",
	"accent-trace",
	"on-accent-trace",
	"accent-debug",
	"on-accent-debug",
	"accent-info",
	"on-accent-info",
	"accent-warn",
	"on-accent-warn",
	"accent-error",
	"on-accent-error",
];

/// Photography the site ships. Staged rather than read, so `asset!()` fingerprints
/// and re-encodes it; the repo-root copy stays the master the print material can
/// also draw from.
const PHOTOS: &[&str] = &["hero.jpg"];

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

	std::fs::create_dir_all(out.join("photos")).expect("create aquafix/assets/photos");
	for photo in PHOTOS {
		std::fs::copy(shared.join("photos").join(photo), out.join("photos").join(photo)).unwrap_or_else(|e| panic!("stage {photo}: {e}"));
	}

	std::fs::write(
		out.join("tokens.css"),
		tokens_css(&std::fs::read_to_string(shared.join("brand.toml")).expect("assets/brand.toml")),
	)
	.expect("write tokens.css");

	// Tailwind cannot see the kit's class strings: `ev_lib` is a checkout at no
	// path a committed `@source` could reach. The crate carries them instead.
	std::fs::write(out.join("uikit-classes.txt"), ev_lib_classes::CLASS_INVENTORY).expect("write uikit-classes.txt");

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

	let mut theme = String::new();
	for name in TOKENS {
		theme.push_str(&format!("  --color-{name}: var(--{name});\n"));
	}

	let scope = |values: &BTreeMap<String, String>| -> String {
		let missing: Vec<_> = TOKENS.iter().filter(|t| !values.contains_key(**t)).collect();
		assert!(missing.is_empty(), "brand.toml scope is missing kit tokens: {missing:?}");
		let extra: Vec<_> = values.keys().filter(|k| !TOKENS.contains(&k.as_str())).collect();
		assert!(extra.is_empty(), "brand.toml scope names colours the kit has no token for: {extra:?}");
		TOKENS.iter().map(|t| format!("  --{t}: {};\n", values[*t])).collect()
	};

	format!(
		"/* GENERATED from assets/brand.toml by aquafix_assets/build.rs. Do not edit.\n\
		 *\n\
		 * `@theme inline` wires the values into Tailwind utilities; the scopes carry\n\
		 * the raw custom properties, so a `<Section polarity=…>` re-themes its subtree\n\
		 * and `bg-card text-ink` is correct on both sides. */\n\
		 \n\
		 @theme inline {{\n\
		 {theme}\n\
		 \x20 --font-display: \"{display}\", ui-sans-serif, system-ui, sans-serif;\n\
		 \x20 --font-text: \"{text}\", ui-sans-serif, system-ui, sans-serif;\n\
		 \x20 --font-sans: \"{text}\", ui-sans-serif, system-ui, sans-serif;\n\
		 }}\n\
		 \n\
		 :root,\n\
		 .light {{\n\
		 {light}\
		 }}\n\
		 \n\
		 .dark {{\n\
		 {dark}\
		 }}\n",
		light = scope(&brand.colors.light),
		dark = scope(&brand.colors.dark),
		display = brand.fonts.display,
		text = brand.fonts.text,
	)
}

#[derive(serde::Deserialize)]
struct BrandToml {
	colors: Scopes,
	fonts: FontsToml,
}

#[derive(serde::Deserialize)]
struct Scopes {
	light: BTreeMap<String, String>,
	dark: BTreeMap<String, String>,
}

#[derive(serde::Deserialize)]
struct FontsToml {
	display: String,
	text: String,
}
