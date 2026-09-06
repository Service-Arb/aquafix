//! Figma `5:28`. Four things customers actually said, each answered with a
//! written term rather than an adjective.

use dioxus::prelude::*;

use crate::{
	blocks::{Section, SectionHead, Tone},
	content::{OBJECTIONS, OBJECTIONS_HEAD},
};

#[component]
pub fn Objections() -> Element {
	let (eyebrow, title, lede) = OBJECTIONS_HEAD;
	rsx! {
		Section { tone: Tone::Base, tight: true,
			div { class: "flex flex-col gap-6 md:gap-12",
				SectionHead { tone: Tone::Base, eyebrow, title, lede }
				div { class: "grid gap-5 md:grid-cols-2 lg:grid-cols-4",
					for objection in OBJECTIONS {
						div { class: "flex flex-col gap-4 rounded-[14px] border border-rule bg-subtle px-[26px] pb-7 pt-[26px] md:gap-[18px]",
							p { class: "text-[15px] font-medium leading-[1.5] text-ink-soft", "{objection.quote}" }
							div { class: "h-0.5 w-10 bg-accent" }
							p { class: "font-display text-[19px] md:text-[21px] font-bold leading-[1.3] text-ink",
								"{objection.answer_title}"
							}
							p { class: "text-[14.5px] leading-[1.6] text-ink-mid", "{objection.answer_body}" }
						}
					}
				}
			}
		}
	}
}
