//! How the page is dressed, as a selectable thing separate from what each
//! section says.
//!
//! `4b9cb74` reverted a full rewrite because the argument it settled — alternating
//! full-bleed bands, or one continuous field with panels on it — was never
//! actually put side by side. Those two are a stylesheet: the class here goes on
//! the page root and every rule they change lives under it in `input.css`, so no
//! section file knows which one is running.
//!
//! `quiet` is the third kind, and it needed a second seam. Its argument is not
//! how the bands are dressed but how many words are on them, so it brings its
//! own home page — `home` below — and its own copy, under `src/quiet/`.
//! Everything it owns is in that directory; removing the version is that
//! directory, its `const`, its `ALL` entry and its `input.css` block.

use dioxus::prelude::*;

use crate::content::Lang;

pub const BANDS: Composition = Composition {
	name: "bands",
	root: "",
	home: crate::pages::banded_home,
};
pub const FIELD: Composition = Composition {
	name: "field",
	root: "field",
	home: crate::pages::banded_home,
};
pub const QUIET: Composition = Composition {
	name: "quiet",
	root: "quiet",
	home: crate::quiet::home,
};
/// Every composition that can be selected. Adding one is an entry here, a `const`
/// above, and a block in `input.css`.
pub const ALL: &[&Composition] = &[&BANDS, &FIELD, &QUIET];

pub struct Composition {
	pub name: &'static str,
	/// The class on the page root. Every rule a composition changes is under it
	/// in `input.css`.
	pub root: &'static str,
	/// Everything below `<Head>` on the home page. `bands` and `field` differ
	/// only in dress, so they share one; a version that changes what is said
	/// brings its own.
	pub home: fn(Lang) -> Element,
}

/// `AQUAFIX_COMPOSITION` at build time. Compile-time rather than per-request so the
/// server and the hydrating wasm cannot disagree about what they drew.
pub fn selected() -> &'static Composition {
	match option_env!("AQUAFIX_COMPOSITION") {
		None | Some("bands") => &BANDS,
		Some("field") => &FIELD,
		Some("quiet") => &QUIET,
		Some(other) => panic!("unknown AQUAFIX_COMPOSITION={other} — see compose::ALL"),
	}
}
