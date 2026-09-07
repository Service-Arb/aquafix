//! Figma `27:96`. Pinned to the bottom, mobile only. `sticky`, not `fixed`: it
//! is the last thing in the page flow, so it reserves its own height at the end
//! of the document instead of the page guessing that height back.

use dioxus::prelude::*;

use crate::{
	analytics,
	content::{Lang, SITE},
};

#[component]
pub fn BottomCallBar(lang: Lang) -> Element {
	let t = lang.text();
	rsx! {
		div { id: "callbar", class: "sticky bottom-0 z-30 flex gap-2.5 border-t border-rule bg-surface px-3 py-2.5 shadow-[0_-6px_20px_0_rgba(0,13,31,0.18)] md:hidden",
			a {
				href: SITE.tel_href(),
				onclick: move |_| analytics::capture(analytics::CALLBAR_PHONE, &[("surface", "callbar")]),
				class: "flex flex-1 items-center justify-center rounded-lg bg-inverse-deep py-3.5 font-display text-[15px] font-semibold text-on-inverse",
				"{t.call_label()}"
			}
			a { href: lang.href("/#quote"), class: "flex flex-1 items-center justify-center rounded-lg bg-action py-3.5 font-display text-[15px] font-semibold text-on-action",
				"{t.cta_short}"
			}
		}
	}
}
