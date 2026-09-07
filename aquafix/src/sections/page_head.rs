//! Figma `28:23` / `28:104` / `28:185` — one parameterised head, not three.

use dioxus::prelude::*;

use ev_lib::uikit::{Display, Eyebrow, Polarity, Section};

use crate::content::Page;

#[component]
pub fn PageHead(page: ReadSignal<&'static Page>) -> Element {
	let page = page();
	rsx! {
		Section { polarity: Polarity::Dark, tight: true, class: "flex flex-col gap-3 md:gap-3.5",
			Eyebrow { class: "text-[10px] md:text-[11px] tracking-[0.16em]", "{page.eyebrow}" }
			// `text-` and `leading-` merge as one group, so the line height has to ride along
			Display { class: "text-[30px] md:text-[44px] leading-[1.14] tracking-[-0.01em]", "{page.h1}" }
			p { class: "max-w-[48rem] text-[15px] md:text-[17px] leading-[1.58] text-ink-soft", "{page.lede}" }
		}
	}
}
