//! Figma `28:27` / `28:108` / `28:189` — the sub-pages' one action, shared.

use dioxus::prelude::*;

use ev_lib::uikit::{Button, Section, Size, Surface};

use crate::{brand::CTA_FACE, content::Lang};

#[component]
pub fn InlineCta(lang: Lang) -> Element {
	let (line, button) = lang.text().inline_cta;
	rsx! {
		Section { surface: Surface::Primary, tight: true, class: "flex flex-col gap-4 md:flex-row md:items-center md:gap-5",
			p { class: "flex-1 font-display text-[20px] md:text-[24px] font-bold text-on-primary", "{line}" }
			Button {
				href: lang.href("/#quote"),
				size: Size::Xl,
				class: "dark shrink-0 bg-background text-ink {CTA_FACE}",
				"{button}"
			}
		}
	}
}
