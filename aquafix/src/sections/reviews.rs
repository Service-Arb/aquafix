//! Figma `7:21` / `27:62`.
//!
//! Built as an embed slot rather than hand-written cards on purpose: the
//! headline argues that curated five-star walls are read as filtered, and
//! hand-written testimonials are the thing being argued against. The cards
//! below are the visual target the live widget replaces, and the four-star one
//! stays.

use dioxus::prelude::*;

use crate::{
	blocks::{Eyebrow, Head, Section, Tone},
	content::Lang,
};

#[component]
pub fn Reviews(lang: Lang) -> Element {
	let t = lang.text();
	let (eyebrow, title) = t.reviews_head;
	rsx! {
		Section { tone: Tone::Subtle, id: "reviews",
			div { class: "flex flex-col gap-4 md:gap-6",
				div { class: "flex flex-col gap-2 md:gap-3.5",
					Eyebrow { "{eyebrow}" }
					Head { "{title}" }
				}
				div {
					id: "elfsight-google-reviews",
					// The widget replaces this subtree; the height is reserved so it
					// does not shift the page in when it loads.
					class: "flex flex-col gap-4 rounded-[14px] border-[1.5px] border-dashed border-accent px-5 pb-[18px] pt-4 md:px-6",
					p { class: "text-[10.5px] font-medium tracking-[0.12em] text-accent", "{t.reviews_embed_note}" }
					div { class: "flex flex-col gap-5 md:flex-row",
						for review in t.reviews {
							// The mobile frame shows only the four-star card.
							div { class: "flex flex-1 flex-col gap-3.5 rounded-[12px] border border-rule bg-surface px-6 pb-6 pt-[22px] {mobile_visibility(review.stars)}",
								p { class: "text-[17px] text-action",
									{"★".repeat(review.stars as usize)}
									{"☆".repeat(5 - review.stars as usize)}
								}
								p { class: "text-[15px] leading-[1.65] text-ink", "{review.body}" }
								div { class: "flex flex-col gap-[3px]",
									p { class: "text-[14px] font-semibold text-ink", "{review.author}" }
									p { class: "text-[12.5px] text-ink-soft", "{review.attrib}" }
								}
							}
						}
					}
				}
			}
		}
	}
}
/// The mobile frame shows one card, and it is the four-star one — a perfect
/// wall is read as filtered.
fn mobile_visibility(stars: u8) -> &'static str {
	if stars == 5 { "hidden md:flex" } else { "" }
}
