//! Figma `3:7` / `26:11`. The mobile drawer is a `<details>`: a nav that opens
//! without hydration is one less thing on the critical path, and one less thing
//! to test.

use dioxus::prelude::*;

use crate::{
	blocks::{Cta, CtaButton, LangSwitch, PANEL},
	brand::Lockup,
	content::{Lang, SITE},
};

#[component]
pub fn Header(lang: Lang, path: &'static str) -> Element {
	let t = lang.text();
	rsx! {
		header { class: "{PANEL} flex items-center py-3 md:py-5",
			div { class: "flex w-full items-center",
				a { href: lang.href("/"), class: "shrink-0",
					Lockup {
						mark: "h-[26px] w-[22.5px] md:h-8 md:w-[27.7px] text-accent",
						word: "text-[20px] md:text-[25px] text-brand",
					}
				}
				div { class: "flex-1" }
				nav { class: "hidden md:flex items-center gap-[30px] text-[15px] font-medium text-ink-mid",
					for (label, href) in t.nav.iter().copied() {
						a { href: lang.href(href), class: "hover:text-accent", "{label}" }
					}
				}
				div { class: "flex-1 hidden md:block" }
				div { class: "hidden md:flex items-center gap-5",
					LangSwitch {
						lang,
						path,
						class: "text-[13px] font-medium text-ink-mid",
					}
					a { href: SITE.tel_href(), class: "flex flex-col",
						span { class: "text-[10px] font-medium tracking-[0.12em] text-ink-soft",
							"{t.header_phone_label}"
						}
						span { class: "font-display text-[22px] font-bold text-ink",
							"{SITE.phone}"
						}
					}
					CtaButton { kind: Cta::Primary, href: lang.href("/#quote"), "{t.cta}" }
				}
				details { class: "md:hidden",
					summary { class: "flex size-9 items-center justify-center text-[20px] text-ink",
						"☰"
					}
					nav { class: "absolute inset-x-0 z-20 flex flex-col gap-1 border-b border-rule bg-surface px-5 py-3 text-[15px] font-medium text-ink-mid shadow-lg",
						for (label, href) in t.nav.iter().copied() {
							a { href: lang.href(href), class: "py-2", "{label}" }
						}
						a {
							href: SITE.tel_href(),
							class: "py-2 font-display text-[18px] font-bold text-ink",
							"{SITE.phone}"
						}
						LangSwitch {
							lang,
							path,
							class: "py-2 text-[14px] font-medium text-ink-mid",
						}
					}
				}
			}
		}
	}
}
