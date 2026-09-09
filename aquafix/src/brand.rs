//! The mark, the wordmark and the webfaces — the three things that come out of
//! `assets/`, shared byte-for-byte with the business card.

use dioxus::prelude::*;

/// The display face on a call to action. `cn!` merges `font-*` as one group, so
/// a `font-display font-semibold` override loses the family to the weight — the
/// weight goes on as a property instead.
pub const CTA_FACE: &str = "font-display [font-weight:600]";

/// Inlined, not `<img src>`: the mark is ~300 bytes and its fill is
/// `currentColor`, which an external image cannot inherit.
const MARK: &str = include_str!("../../assets/mark.svg");

/// The hexagon. Takes its colour from the nearest `text-*` and its size from
/// `class` (set both dimensions — the design's lockups are not square).
#[component]
pub fn Mark(class: String) -> Element {
	rsx! {
		span { class: "mark {class} inline-block", dangerous_inner_html: MARK }
	}
}

/// AQUA in the surrounding colour, FIX in copper. `size` carries the type scale,
/// which is the only thing that differs between the header, footer and status
/// lockups.
#[component]
pub fn Wordmark(class: String) -> Element {
	rsx! {
		span { class: "font-display font-bold tracking-[0.015em] {class}",
			"AQUA"
			span { class: "text-primary", "FIX" }
		}
	}
}

/// Mark + wordmark, the lock-up as the design draws it everywhere it appears.
#[component]
pub fn Lockup(mark: String, word: String) -> Element {
	rsx! {
		div { class: "flex items-center gap-[11px]",
			Mark { class: mark }
			Wordmark { class: word }
		}
	}
}

/// Self-hosted `@font-face`s over the woff2s in `assets/fonts/`. Rendered once
/// at the app root. No CDN, so this is CSP-clean and identical offline.
///
/// `ev_lib::uikit::Fonts` is not used: it bundles Inter + Playfair, and the
/// display face here is Archivo.
#[component]
pub fn Fonts() -> Element {
	rsx! {
		document::Style { {format!(
			"@font-face{{font-family:'Archivo';font-style:normal;font-weight:600;font-display:swap;src:url('{ARCHIVO_SEMIBOLD}') format('woff2')}}\
			 @font-face{{font-family:'Archivo';font-style:normal;font-weight:700;font-display:swap;src:url('{ARCHIVO_BOLD}') format('woff2')}}\
			 @font-face{{font-family:'Inter';font-style:normal;font-weight:400;font-display:swap;src:url('{INTER_REGULAR}') format('woff2')}}\
			 @font-face{{font-family:'Inter';font-style:normal;font-weight:500;font-display:swap;src:url('{INTER_MEDIUM}') format('woff2')}}\
			 @font-face{{font-family:'Inter';font-style:normal;font-weight:600;font-display:swap;src:url('{INTER_SEMIBOLD}') format('woff2')}}",
			ARCHIVO_SEMIBOLD = asset!("/assets/fonts/Archivo-SemiBold.woff2"),
			ARCHIVO_BOLD = asset!("/assets/fonts/Archivo-Bold.woff2"),
			INTER_REGULAR = asset!("/assets/fonts/Inter-Regular.woff2"),
			INTER_MEDIUM = asset!("/assets/fonts/Inter-Medium.woff2"),
			INTER_SEMIBOLD = asset!("/assets/fonts/Inter-SemiBold.woff2"),
		)} }
	}
}
