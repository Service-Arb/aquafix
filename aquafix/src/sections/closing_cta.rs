//! Figma `9:4` / `27:74`. The action-orange band.
//!
//! Desktop repeats the form inline; mobile drops to the phone, as the frame
//! draws it — a second three-field form below the fold on a 390px screen is not
//! a second chance, it is a scroll cost.

use dioxus::prelude::*;

use ev_lib::uikit::{Button, Display, Eyebrow, Section, Size, Surface};

use crate::{
	analytics,
	brand::CTA_FACE,
	content::{Lang, SITE},
	quote::QuoteFormInline,
};

#[component]
pub fn ClosingCta(lang: Lang) -> Element {
	let t = lang.text();
	rsx! {
		Section { surface: Surface::Primary,
			div { class: "flex flex-col gap-4 md:gap-[26px]",
				div { class: "flex flex-col gap-2.5 md:gap-4",
					span { class: "hidden md:block",
						// One copper now, so the eyebrow's own colour would vanish into
						// the band it sits on.
						Eyebrow { class: "text-on-primary opacity-80", "{t.closing.eyebrow}" }
					}
					Display { "{t.closing.title}" }
					p { class: "text-[14.5px] md:text-[19px] leading-[1.55] opacity-[0.78]",
						span { class: "md:hidden", "{t.closing.lede_short}" }
						span { class: "hidden md:inline", "{t.closing.lede}" }
					}
				}
				div { class: "hidden md:block",
					QuoteFormInline { lang }
				}
				Button {
					href: SITE.tel_href(),
					size: Size::Xl,
					onclick: move |_| analytics::capture(analytics::HERO_PHONE, &[("surface", "closing")]),
					class: "dark md:hidden w-full bg-background text-ink {CTA_FACE}",
					"{t.call_label()}"
				}
				p { class: "hidden md:block text-[16px] font-medium opacity-80", "{t.closing_aside()}" }
			}
		}
	}
}
