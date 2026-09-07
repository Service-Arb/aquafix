//! Figma `7:4`.

use dioxus::prelude::*;

use crate::{
	blocks::{Eyebrow, Head, Section, Tone},
	content::Lang,
};

#[component]
pub fn HowItWorks(lang: Lang) -> Element {
	let t = lang.text();
	let (eyebrow, title) = t.steps_head;
	rsx! {
		Section { tone: Tone::Base, tight: true,
			div { class: "flex flex-col gap-6 md:gap-11",
				div { class: "flex flex-col gap-2 md:gap-3.5",
					Eyebrow { tone: Tone::Base, "{eyebrow}" }
					Head { "{title}" }
				}
				div { class: "grid gap-6 md:grid-cols-3 md:gap-6",
					for step in t.steps {
						div { class: "flex flex-col gap-4 border-t-[3px] border-accent pt-5 md:pt-7",
							p { class: "font-display font-num text-[28px] md:text-[34px] font-bold text-accent", "{step.n}" }
							p { class: "font-display text-[19px] md:text-[22px] font-bold leading-[1.3] text-ink", "{step.title}" }
							p { class: "text-[15px] md:text-[15.5px] leading-[1.62] text-ink-soft", "{step.body}" }
						}
					}
				}
			}
		}
	}
}
