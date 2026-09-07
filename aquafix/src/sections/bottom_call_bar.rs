//! Figma `27:96`. Pinned to the bottom, mobile only. `sticky`, not `fixed`: it
//! is the last thing in the page flow, so it reserves its own height at the end
//! of the document instead of the page guessing that height back.

use dioxus::prelude::*;

use ev_lib::uikit::{Button, ButtonVariant, Size};

use crate::{
	analytics,
	brand::CTA_FACE,
	content::{Lang, SITE},
};

#[component]
pub fn BottomCallBar(lang: Lang) -> Element {
	let t = lang.text();
	rsx! {
		div { id: "callbar", class: "sticky bottom-0 z-30 flex gap-2.5 border-t border-border bg-background px-3 py-2.5 shadow-[0_-6px_20px_0_rgba(0,13,31,0.18)] md:hidden",
			Button {
				href: SITE.tel_href(),
				size: Size::Xl,
				variant: ButtonVariant::Ghost,
				onclick: move |_| analytics::capture(analytics::CALLBAR_PHONE, &[("surface", "callbar")]),
				class: "dark flex-1 bg-background text-ink {CTA_FACE}",
				"{t.call_label()}"
			}
			Button { href: lang.href("/#quote"), size: Size::Xl, class: "flex-1 {CTA_FACE}",
				"{t.cta_short}"
			}
		}
	}
}
