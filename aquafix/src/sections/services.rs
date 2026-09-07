//! Figma `8:4`. Eight jobs, and the refusal that makes the list credible.

use dioxus::prelude::*;

use crate::{
	blocks::{Section, SectionHead, Tone},
	content::Lang,
};

#[component]
pub fn Services(lang: Lang) -> Element {
	let t = lang.text();
	let (eyebrow, title, lede) = t.services_head;
	rsx! {
		Section { tone: Tone::Subtle, tight: true,
			div { class: "flex flex-col gap-6 md:gap-11",
				SectionHead { tone: Tone::Subtle, eyebrow, title, lede }
				div { class: "grid gap-5 sm:grid-cols-2 md:grid-cols-4",
					for service in t.services {
						div { class: "flex flex-col gap-3 rounded-[12px] border border-rule bg-surface px-6 pb-[26px] pt-6",
							p { class: "font-display text-[19px] font-bold leading-[1.3] text-ink", "{service.name}" }
							p { class: "font-display font-num text-[17px] font-bold text-accent", "{service.from_display(t)}" }
							p { class: "text-[14.5px] leading-[1.6] text-ink-soft", "{service.body}" }
						}
					}
				}
			}
		}
	}
}
