//! How the page is dressed, as a selectable thing separate from what each
//! section says.
//!
//! `4b9cb74` reverted a full rewrite because the argument it settled — alternating
//! full-bleed bands, or one continuous field with panels on it — was never
//! actually put side by side. Both are a stylesheet: the class here goes on the
//! page root and every rule a composition changes lives under it in `input.css`,
//! so no section file knows which one is running.

pub const BANDS: Composition = Composition { name: "bands", root: "" };
pub const FIELD: Composition = Composition { name: "field", root: "field" };
/// Every composition that can be selected. Adding one is an entry here, a `const`
/// above, and a block in `input.css`.
pub const ALL: &[&Composition] = &[&BANDS, &FIELD];

pub struct Composition {
	pub name: &'static str,
	/// The class on the page root. Every rule a composition changes is under it
	/// in `input.css`.
	pub root: &'static str,
}

/// `AQUAFIX_COMPOSITION` at build time. Compile-time rather than per-request so the
/// server and the hydrating wasm cannot disagree about what they drew.
pub fn selected() -> &'static Composition {
	match option_env!("AQUAFIX_COMPOSITION") {
		None | Some("bands") => &BANDS,
		Some("field") => &FIELD,
		Some(other) => panic!("unknown AQUAFIX_COMPOSITION={other} — see compose::ALL"),
	}
}
