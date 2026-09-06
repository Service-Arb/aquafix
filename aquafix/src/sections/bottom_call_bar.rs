//! Figma `27:96`. Fixed to the bottom, mobile only. The page reserves space for
//! it so the footer is not covered.

use dioxus::prelude::*;

use crate::{
	analytics,
	content::{CTA_SHORT, SITE, call_label},
};

#[component]
pub fn BottomCallBar() -> Element {
	rsx! {
		div { class: "fixed inset-x-0 bottom-0 z-30 flex gap-2.5 border-t border-rule bg-surface px-3 py-2.5 shadow-[0_-6px_20px_0_rgba(0,13,31,0.18)] md:hidden",
			a {
				href: SITE.tel_href(),
				onclick: move |_| analytics::capture(analytics::CALLBAR_PHONE, &[("surface", "callbar")]),
				class: "flex flex-1 items-center justify-center rounded-lg bg-inverse-deep py-3.5 font-display text-[15px] font-semibold text-on-inverse",
				"{call_label()}"
			}
			a { href: "/#quote", class: "flex flex-1 items-center justify-center rounded-lg bg-action py-3.5 font-display text-[15px] font-semibold text-on-action",
				"{CTA_SHORT}"
			}
		}
	}
}
