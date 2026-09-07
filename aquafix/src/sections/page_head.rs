//! Figma `28:23` / `28:104` / `28:185` — one parameterised head, not three.

use dioxus::prelude::*;

use crate::{blocks::PANEL, content::Page};

#[component]
pub fn PageHead(page: ReadSignal<&'static Page>) -> Element {
	let page = page();
	rsx! {
		div { class: "{PANEL} flex flex-col gap-3 bg-inverse-deep py-9 sm:py-12 md:gap-3.5 md:py-14",
			p { class: "text-[10px] md:text-[11px] font-medium tracking-[0.16em] text-accent",
				"{page.eyebrow}"
			}
			h1 { class: "max-w-[54rem] font-display text-[30px] md:text-[44px] font-bold leading-[1.14] tracking-[-0.01em] text-on-inverse",
				"{page.h1}"
			}
			p { class: "max-w-[48rem] text-[15px] md:text-[17px] leading-[1.58] text-on-inverse-muted",
				"{page.lede}"
			}
		}
	}
}
