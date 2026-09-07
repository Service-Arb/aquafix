//! Figma `28:27` / `28:108` / `28:189` — the sub-pages' one action, shared.

use dioxus::prelude::*;

use crate::{
	blocks::{Cta, CtaButton, Section, Tone},
	content::Lang,
};

#[component]
pub fn InlineCta(lang: Lang) -> Element {
	let (line, button) = lang.text().inline_cta;
	rsx! {
		Section { tone: Tone::Action, tight: true,
			div { class: "flex flex-col gap-4 md:flex-row md:items-center md:gap-6",
				p { class: "flex-1 font-display text-[20px] font-bold text-on-action md:text-[24px]",
					"{line}"
				}
				CtaButton {
					kind: Cta::Dark,
					href: lang.href("/#quote"),
					class: "shrink-0",
					"{button}"
				}
			}
		}
	}
}
