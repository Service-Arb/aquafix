//! Figma `3:26` / `26:21`. The quote form lives *in* the hero, not behind a
//! click: a homeowner standing in water needs the price path in the first
//! screen (`docs/refs/sites/README.md`, on rejecting Hyros' airy above-fold).

use dioxus::prelude::*;

use ev_lib::uikit::{Button, ButtonVariant, Check, Polarity, Section, Size, Stat};

use crate::{
	analytics,
	brand::{CTA_FACE, Mark},
	content::{Lang, SITE},
	quote::QuoteCard,
};

#[component]
pub fn Hero(lang: Lang) -> Element {
	let t = lang.text();
	let p = lang.page("/");
	rsx! {
		Section { polarity: Polarity::Dark, class: "relative overflow-hidden",
			Mark { class: "pointer-events-none absolute -left-24 -top-16 h-[520px] w-[450px] text-primary opacity-[0.06] md:-left-45 md:-top-30 md:h-[760px] md:w-[658px]" }
			div { class: "relative flex flex-col gap-8 md:flex-row md:items-start md:gap-9",
				div { class: "flex w-full flex-col gap-4 md:w-[656px] md:gap-[18px]",
					p { class: "text-[10px] md:text-[11.5px] font-medium tracking-[0.14em] text-primary", "{t.hero_eyebrow}" }
					h1 { class: "font-display font-bold text-[30px] md:text-[46px] leading-[1.08] tracking-[-0.01em] text-ink",
						"{p.h1}"
					}
					p { class: "hidden md:block text-[17px] leading-[1.58] text-ink-soft", "{p.lede}" }
					div { class: "flex flex-col gap-3 text-[14px] md:text-[16px]",
						for tick in t.hero_ticks {
							div { class: "flex items-center gap-3",
								Check {}
								span { class: "font-medium text-ink", "{tick}" }
							}
						}
					}
					div { class: "hidden md:flex items-center gap-3.5",
						Button { href: "#quote", size: Size::Xl, class: CTA_FACE, "{t.cta}" }
						Button {
							href: SITE.tel_href(),
							size: Size::Xl,
							variant: ButtonVariant::Outline,
							class: CTA_FACE,
							onclick: move |_| analytics::capture(analytics::HERO_PHONE, &[("surface", "hero")]),
							"{SITE.phone}"
						}
					}
					div { class: "flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] md:text-[14px] text-ink",
						for (i , (figure , label)) in t.hero_microproof.iter().enumerate() {
							if i > 0 {
								span { class: "text-border", "|" }
							}
							Stat { figure: "{figure}", label: "{label}" }
						}
					}
				}
				QuoteCard { lang }
			}
		}
	}
}
