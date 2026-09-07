//! Figma `3:26` / `26:21`. The quote form lives *in* the hero, not behind a
//! click: a homeowner standing in water needs the price path in the first
//! screen (`docs/refs/sites/README.md`, on rejecting Hyros' airy above-fold).

use dioxus::prelude::*;

use crate::{
	analytics,
	blocks::{Cta, CtaButton, PANEL, StatRow, Tick, Tone},
	brand::Mark,
	content::{Lang, SITE},
	quote::QuoteCard,
};

#[component]
pub fn Hero(lang: Lang) -> Element {
	let t = lang.text();
	let p = lang.page("/");
	rsx! {
		div { class: "{PANEL} relative overflow-hidden bg-inverse-deep py-9 sm:py-12 md:py-16",
			Mark { class: "pointer-events-none absolute -left-24 -top-16 h-[520px] w-[450px] text-accent opacity-[0.06] md:-left-45 md:-top-30 md:h-[760px] md:w-[658px]" }
			div { class: "relative flex flex-col gap-8 md:flex-row md:items-start md:gap-9",
				// Figma's 656 is the basis, not the width: the card is fixed, so the
				// copy takes whatever the column has left rather than leaving a void
				// beside it on anything wider than the 1440 frame.
				div { class: "flex w-full flex-col gap-4 md:grow md:shrink md:basis-[656px] md:gap-[18px]",
					p { class: "text-[10px] md:text-[11.5px] font-medium tracking-[0.14em] text-accent",
						"{t.hero_eyebrow}"
					}
					// Below the seam the panel is as wide as the viewport allows and
					// nothing else is bounding the line; the column does it above.
					h1 { class: "max-w-[34rem] font-display font-bold text-[30px] md:max-w-none md:text-[46px] leading-[1.08] tracking-[-0.01em] text-on-inverse",
						"{p.h1}"
					}
					p { class: "hidden md:block text-[17px] leading-[1.58] text-on-inverse-muted",
						"{p.lede}"
					}
					div { class: "flex flex-col gap-3 text-[14px] md:text-[16px]",
						for tick in t.hero_ticks {
							div { class: "flex items-center gap-3",
								Tick {}
								span { class: "font-medium text-on-inverse", "{tick}" }
							}
						}
					}
					div { class: "hidden md:flex items-center gap-3.5",
						CtaButton { kind: Cta::Primary, href: "#quote", "{t.cta}" }
						CtaButton {
							kind: Cta::Outline,
							href: SITE.tel_href(),
							onclick: move |_| analytics::capture(analytics::HERO_PHONE, &[("surface", "hero")]),
							"{SITE.phone}"
						}
					}
					div { class: "flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] md:text-[14px] text-on-inverse",
						for (i, (figure, label)) in t.hero_microproof.iter().enumerate() {
							if i > 0 {
								span { class: "text-rule-inverse", "|" }
							}
							StatRow {
								tone: Tone::Deep,
								figure: "{figure}",
								label: "{label}",
							}
						}
					}
				}
				QuoteCard { lang }
			}
		}
	}
}
