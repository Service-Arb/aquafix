//! Figma `3:7` / `26:11`. The mobile drawer is a `<details>`: a nav that opens
//! without hydration is one less thing on the critical path, and one less thing
//! to test.

use dioxus::prelude::*;

use crate::{
	blocks::{Cta, CtaButton},
	brand::Lockup,
	content::{CTA, NAV, SITE},
};

#[component]
pub fn Header() -> Element {
	rsx! {
		header { class: "border-b border-rule bg-surface",
			div { class: "flex items-center px-5 py-2.5 md:px-30 md:py-[18px]",
				a { href: "/", class: "shrink-0",
					Lockup { mark: "h-[26px] w-[22.5px] md:h-8 md:w-[27.7px] text-accent", word: "text-[20px] md:text-[25px] text-brand" }
				}
				div { class: "flex-1" }
				nav { class: "hidden md:flex items-center gap-[30px] text-[15px] font-medium text-ink-mid",
					for (label , href) in NAV {
						a { href: "{href}", class: "hover:text-accent", "{label}" }
					}
				}
				div { class: "flex-1 hidden md:block" }
				div { class: "hidden md:flex items-center gap-5",
					a { href: SITE.tel_href(), class: "flex flex-col",
						span { class: "text-[10px] font-medium tracking-[0.12em] text-ink-soft", "24/7 · ANSWERED BY A HUMAN" }
						span { class: "font-display text-[22px] font-bold text-ink", "{SITE.phone}" }
					}
					CtaButton { kind: Cta::Primary, href: "/#quote", "{CTA}" }
				}
				details { class: "md:hidden",
					summary { class: "flex size-9 items-center justify-center text-[20px] text-ink", "☰" }
					nav { class: "absolute inset-x-0 z-20 flex flex-col gap-1 border-b border-rule bg-surface px-5 py-3 text-[15px] font-medium text-ink-mid shadow-lg",
						for (label , href) in NAV {
							a { href: "{href}", class: "py-2", "{label}" }
						}
						a { href: SITE.tel_href(), class: "py-2 font-display text-[18px] font-bold text-ink", "{SITE.phone}" }
					}
				}
			}
		}
	}
}
