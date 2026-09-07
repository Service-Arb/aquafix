//! Figma `5:28`. Four things customers actually said, each answered with a
//! written term rather than an adjective.

use dioxus::prelude::*;

use crate::{
	blocks::{CARD, Section, SectionHead, Tone},
	content::Lang,
};

#[component]
pub fn Objections(lang: Lang) -> Element {
	let t = lang.text();
	let (eyebrow, title, lede) = t.objections_head;
	rsx! {
		Section { tone: Tone::Base, tight: true,
			div { class: "flex flex-col gap-6 md:gap-12",
				SectionHead {
					tone: Tone::Base,
					eyebrow,
					title,
					lede,
				}
				// Subgrid: the quotes are different lengths, and without it the accent
				// rules under them sit at four different heights.
				div { class: "grid gap-5 sm:grid-cols-2 md:grid-cols-4 md:grid-rows-[auto_auto_auto_auto]",
					for objection in t.objections {
						div { class: "flex flex-col gap-4 {CARD} border border-rule bg-subtle px-[26px] pb-7 pt-[26px] md:row-span-4 md:grid md:grid-rows-subgrid md:gap-[18px]",
							p { class: "text-[15px] font-medium leading-[1.5] text-ink-soft",
								"{objection.quote}"
							}
							div { class: "h-0.5 w-10 bg-accent" }
							p { class: "font-display text-[19px] md:text-[21px] font-bold leading-[1.3] text-ink",
								"{objection.answer_title}"
							}
							p { class: "text-[14.5px] leading-[1.6] text-ink-mid",
								"{objection.answer_body}"
							}
						}
					}
				}
			}
		}
	}
}
