//! Figma `7:47`. Four people, named, with their licence numbers.

use dioxus::prelude::*;

use crate::{
	blocks::{Section, SectionHead, Tone},
	content::{CREW, CREW_HEAD},
};

#[component]
pub fn Crew() -> Element {
	let (eyebrow, title, lede) = CREW_HEAD;
	rsx! {
		Section { tone: Tone::Base, tight: true, id: "crew",
			div { class: "flex flex-col gap-6 md:gap-11",
				SectionHead { tone: Tone::Base, eyebrow, title, lede }
				div { class: "grid gap-5 sm:grid-cols-2 lg:grid-cols-4",
					for member in CREW {
						div {
							id: "crew-{member.initials}",
							class: "flex flex-col gap-4 rounded-[14px] border border-rule bg-subtle px-6 py-[26px]",
							div { class: "flex size-[66px] items-center justify-center rounded-full bg-brand font-display text-[22px] font-bold text-action",
								"{member.initials}"
							}
							div { class: "flex flex-col gap-[5px]",
								p { class: "font-display text-[20px] font-bold text-ink", "{member.name}" }
								p { class: "text-[14px] font-medium text-ink-soft", "{member.role}" }
							}
							div { class: "flex flex-col gap-[5px] text-[13.5px] text-ink-mid",
								p { "{member.years}" }
								p { "{member.licence}" }
							}
						}
					}
				}
			}
		}
	}
}
