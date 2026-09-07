//! Figma `6:53` / `27:42`. Three cards on desktop, a divided list on mobile.
//!
//! Each pillar is written as a term the company pays for, never as an
//! adjective — the Hormozi rule the whole page is argued from.

use dioxus::prelude::*;

use crate::{
	blocks::{Cta, CtaButton, Eyebrow, Head, Section, Tone},
	content::Lang,
};

#[component]
pub fn Guarantee(lang: Lang) -> Element {
	let t = lang.text();
	let (eyebrow, title) = t.guarantee_head;
	rsx! {
		Section { tone: Tone::Inverse, id: "guarantee",
			div { class: "flex flex-col gap-4 md:gap-8",
				div { class: "flex flex-col gap-2 md:gap-3.5",
					Eyebrow { "{eyebrow}" }
					Head { "{title}" }
				}
				div { class: "flex flex-col md:flex-row md:gap-6",
					for pillar in t.pillars {
						div { class: "flex gap-3.5 border-b border-rule-inverse py-4 last:border-b-0 md:flex-1 md:flex-col md:gap-3 md:rounded-[14px] md:border md:border-rule-inverse md:bg-inverse-raised md:px-7 md:pb-6 md:pt-[22px]",
							span { class: "font-display font-num text-[20px] md:text-[30px] font-bold text-accent", "{pillar.n}" }
							div { class: "flex flex-1 flex-col gap-1.5 md:gap-3",
								p { class: "font-display text-[16px] md:text-[22px] font-bold leading-[1.3] text-on-inverse",
									"{pillar.title}"
								}
								p { class: "text-[13.5px] md:text-[15px] leading-[1.55] md:leading-[1.62] text-on-inverse-muted",
									span { class: "md:hidden", "{pillar.short}" }
									span { class: "hidden md:inline", "{pillar.body}" }
								}
							}
						}
					}
				}
				div { class: "hidden md:flex items-center gap-[18px]",
					CtaButton { kind: Cta::Primary, href: lang.href("/#quote"), "{t.cta}" }
					p { class: "text-[16px] text-on-inverse-muted", "{t.guarantee_cta_aside()}" }
				}
			}
		}
	}
}
