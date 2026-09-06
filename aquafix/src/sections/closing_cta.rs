//! Figma `9:4` / `27:74`. The action-orange band.
//!
//! Desktop repeats the form inline; mobile drops to the phone, as the frame
//! draws it — a second three-field form below the fold on a 390px screen is not
//! a second chance, it is a scroll cost.

use dioxus::prelude::*;

use crate::{
	analytics,
	blocks::{Eyebrow, Head, Section, Tone},
	content::{CLOSING, SITE, call_label, closing_aside},
	quote::QuoteFormInline,
};

#[component]
pub fn ClosingCta() -> Element {
	rsx! {
		Section { tone: Tone::Action,
			div { class: "flex flex-col gap-4 md:gap-[26px]",
				div { class: "flex flex-col gap-2.5 md:gap-4",
					span { class: "hidden md:block",
						Eyebrow { "{CLOSING.eyebrow}" }
					}
					Head { "{CLOSING.title}" }
					p { class: "text-[14.5px] md:text-[19px] leading-[1.55] opacity-[0.78]",
						span { class: "md:hidden", "{CLOSING.lede_short}" }
						span { class: "hidden md:inline", "{CLOSING.lede}" }
					}
				}
				div { class: "hidden md:block",
					QuoteFormInline {}
				}
				a {
					href: SITE.tel_href(),
					onclick: move |_| analytics::capture(analytics::HERO_PHONE, &[("surface", "closing")]),
					class: "md:hidden w-full rounded-[9px] bg-inverse-deep py-4 text-center font-display text-[16px] font-semibold text-on-inverse",
					"{call_label()}"
				}
				p { class: "hidden md:block text-[16px] font-medium opacity-80", "{closing_aside()}" }
			}
		}
	}
}
