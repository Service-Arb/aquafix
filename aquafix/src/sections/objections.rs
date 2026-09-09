//! Figma `5:28`. Four things customers actually said, each answered with a
//! written term rather than an adjective.

use dioxus::prelude::*;
use ev_lib::uikit::{Section, SectionHead};

use crate::content::Lang;

#[component]
pub fn Objections(lang: Lang) -> Element {
	let t = lang.text();
	let (eyebrow, title, lede) = t.objections_head;
	rsx! {
		Section { tight: true,
			div { class: "flex flex-col gap-6 md:gap-12",
				SectionHead { eyebrow, title, lede }
				// Subgrid, so a two-line quote does not push its answer below the
				// neighbouring cards' — the row reads as one.
				div { class: "grid gap-5 sm:grid-cols-2 md:grid-cols-4 md:grid-rows-[auto_auto_auto_auto]",
					for objection in t.objections {
						div { class: "flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-card px-[26px] pb-7 pt-[26px] md:row-span-4 md:grid md:grid-rows-subgrid md:gap-[18px]",
							p { class: "text-[15px] font-medium leading-[1.5] text-ink-soft", "{objection.quote}" }
							div { class: "h-0.5 w-10 bg-primary" }
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
