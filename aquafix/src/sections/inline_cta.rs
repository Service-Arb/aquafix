//! Figma `28:27` / `28:108` / `28:189` — the sub-pages' one action, shared.

use dioxus::prelude::*;

use crate::content::INLINE_CTA;

#[component]
pub fn InlineCta() -> Element {
	let (line, button) = INLINE_CTA;
	rsx! {
		div { class: "flex flex-col gap-4 bg-action px-5 py-8 md:flex-row md:items-center md:gap-5 md:px-30 md:pb-11 md:pt-10",
			p { class: "flex-1 font-display text-[20px] md:text-[24px] font-bold text-on-action", "{line}" }
			a { href: "/#quote", class: "shrink-0 rounded-[9px] bg-inverse-deep px-7 py-4 text-center font-display text-[16px] font-semibold text-on-inverse",
				"{button}"
			}
		}
	}
}
