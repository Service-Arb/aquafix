//! Figma `Site — v3 quiet / Hero`.
//!
//! The one place the version's rule is visible as geometry: the photograph is
//! the only element that answers the viewport. The message sits in a fixed
//! measure pinned to the gutter, so it is the same block of pixels at 1440 and
//! at 2560 and the composition never rebalances under you.

use dioxus::prelude::*;
use ev_lib::uikit::{Button, ButtonVariant, Size};

use crate::{
	analytics,
	brand::CTA_FACE,
	content::{Lang, SITE},
	quiet::copy::copy,
};

/// A hero crop, not the library shot: the master carries the depot signage
/// across its top third, which puts a second wordmark under the header and a
/// second "prix fixe, réparé aujourd'hui" under the headline. Cropping below it
/// is the only fix — no scrim makes a legible sign stop reading.
const PHOTO: Asset = asset!("/assets/photos/hero-wide.jpg");

#[component]
pub fn Hero(lang: Lang) -> Element {
	let t = lang.text();
	let c = copy(lang);
	rsx! {
		section { class: "quiet-hero relative isolate flex min-h-[580px] flex-col justify-end overflow-hidden md:min-h-[76vh] md:max-h-[860px] md:justify-center",
			img {
				src: PHOTO,
				alt: "{t.hero_photo_alt}",
				fetchpriority: "high",
				decoding: "async",
				class: "absolute inset-0 -z-20 h-full w-full object-cover object-[72%_50%] md:object-[60%_42%]",
			}
			// Heaviest where the words are, so the crew stays legible without
			// the type ever sitting on a face.
			div { class: "quiet-scrim absolute inset-0 -z-10" }

			div { class: "w-full px-[var(--page-px)] pb-12 pt-28 md:pb-0 md:pt-0",
				div { class: "quiet-measure flex flex-col",
					p { class: "text-[10.5px] font-semibold tracking-[0.16em] text-primary md:text-[12px]",
						"{c.eyebrow}"
					}
					h1 { class: "mt-4 font-display font-bold uppercase leading-[0.99] tracking-[-0.02em] text-[clamp(2.6rem,9vw,4.75rem)] text-white md:mt-5",
						"{c.display[0]}"
						br {}
						span { class: "text-primary", "{c.display[1]}" }
						br {}
						"{c.display[2]}"
					}
					p { class: "mt-5 text-[15.5px] leading-[1.6] text-ink-soft md:mt-6 md:text-[18px]",
						"{c.lede}"
					}
					div { class: "mt-7 flex flex-wrap items-center gap-x-6 gap-y-4 md:mt-8",
						Button { href: lang.href("/#quote"), size: Size::Xl, class: CTA_FACE, "{c.cta}" }
						Button {
							href: SITE.tel_href(),
							size: Size::Xl,
							variant: ButtonVariant::Ghost,
							class: "{CTA_FACE} !px-0 font-display !text-[19px] !font-bold text-white hover:!bg-transparent hover:text-primary md:!text-[21px]",
							onclick: move |_| analytics::capture(analytics::HERO_PHONE, &[("surface", "hero")]),
							"{SITE.phone}"
						}
					}
					// The proof band used to be its own full-width row of six.
					// Four figures under a rule say the same thing inside the
					// measure, and cost a section.
					div { class: "mt-9 border-t border-white/20 pt-6 md:mt-11",
						// Two-up on mobile rather than wrapping three-then-one.
						dl { class: "grid grid-cols-2 gap-x-6 gap-y-5 md:flex md:flex-wrap md:gap-x-10",
							for (figure , label) in c.stats.iter() {
								div { class: "flex flex-col gap-1",
									dt { class: "font-display font-num text-[21px] font-bold text-white md:text-[25px]", "{figure}" }
									dd { class: "text-[10px] font-medium tracking-[0.1em] text-ink-soft md:text-[10.5px]", "{label}" }
								}
							}
						}
					}
				}
			}
		}
	}
}
