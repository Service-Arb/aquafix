//! Figma `8:4`. Eight jobs, and the refusal that makes the list credible.

use dioxus::prelude::*;

use crate::{
	blocks::{CARD, Section, SectionHead, Tone},
	content::Lang,
};

#[component]
pub fn Services(lang: Lang) -> Element {
	let t = lang.text();
	let (eyebrow, title, lede) = t.services_head;
	rsx! {
		Section { tone: Tone::Subtle, tight: true,
			div { class: "flex flex-col gap-6 md:gap-11",
				SectionHead {
					tone: Tone::Subtle,
					eyebrow,
					title,
					lede,
				}
				// Subgrid, so a two-line job name does not push its price and body
				// below the neighbouring cards' — the row reads as one table.
				div { class: "grid gap-5 sm:grid-cols-2 md:grid-cols-4 md:grid-rows-[auto_auto_auto]",
					for service in t.services {
						div { class: "flex flex-col gap-3 {CARD} border border-rule bg-surface px-6 pb-[26px] pt-6 md:row-span-3 md:grid md:grid-rows-subgrid",
							p { class: "font-display text-[19px] font-bold leading-[1.3] text-ink",
								"{service.name}"
							}
							p { class: "font-display font-num text-[17px] font-bold text-accent",
								"{service.from_display(t)}"
							}
							p { class: "text-[14.5px] leading-[1.6] text-ink-soft",
								"{service.body}"
							}
						}
					}
				}
			}
		}
	}
}
