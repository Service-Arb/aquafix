//! Figma `28:23` / `28:104` / `28:185` — one parameterised head, not three.

use dioxus::prelude::*;

use crate::content::Page;

#[component]
pub fn PageHead(page: ReadSignal<&'static Page>) -> Element {
	let page = page();
	rsx! {
		div { class: "flex flex-col gap-3 bg-inverse-deep px-5 pb-9 pt-8 md:gap-3.5 md:px-30 md:pb-13 md:pt-14",
			p { class: "text-[10px] md:text-[11px] font-medium tracking-[0.16em] text-accent", "{page.eyebrow}" }
			h1 { class: "max-w-[54rem] font-display text-[30px] md:text-[44px] font-bold leading-[1.14] tracking-[-0.01em] text-on-inverse",
				"{page.h1}"
			}
			p { class: "max-w-[48rem] text-[15px] md:text-[17px] leading-[1.58] text-on-inverse-muted", "{page.lede}" }
		}
	}
}
