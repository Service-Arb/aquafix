//! Figma `8:93`. `<details>`, not an accordion component: it opens without
//! hydration, is keyboard- and screen-reader-correct for free, and keeps the
//! wasm graph smaller on a page whose visitor is on mobile data.

use dioxus::prelude::*;

use crate::{
	analytics,
	blocks::{Eyebrow, Head, Section, Tone},
	content::{FAQ_HEAD, FAQS},
};

#[component]
pub fn Faq() -> Element {
	let (eyebrow, title) = FAQ_HEAD;
	rsx! {
		Section { tone: Tone::Subtle, tight: true, id: "faq",
			div { class: "flex flex-col gap-6 md:gap-11",
				div { class: "flex flex-col gap-2 md:gap-3.5",
					Eyebrow { "{eyebrow}" }
					Head { "{title}" }
				}
				div { class: "overflow-hidden rounded-[14px] border border-rule bg-surface",
					for (i , faq) in FAQS.iter().enumerate() {
						details {
							class: "border-b border-rule last:border-b-0",
							ontoggle: move |_| analytics::capture(analytics::FAQ_OPENED, &[("index", &i.to_string())]),
							summary { class: "flex items-start gap-4 px-5 py-5 md:px-[30px] md:pb-[26px] md:pt-6",
								span { class: "flex-1 font-display text-[17px] md:text-[19px] font-bold leading-[1.35] text-ink",
									"{faq.q}"
								}
								span { class: "text-[18px] text-accent", "+" }
							}
							p { class: "px-5 pb-5 md:px-[30px] md:pb-[26px] text-[15px] md:text-[15.5px] leading-[1.65] text-ink-soft",
								"{faq.a}"
							}
						}
					}
				}
			}
		}
	}
}
