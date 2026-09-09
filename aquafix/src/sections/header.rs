//! Figma `3:7` / `26:11`. The mobile drawer is a `<details>`: a nav that opens
//! without hydration is one less thing on the critical path, and one less thing
//! to test.

use dioxus::prelude::*;
use ev_lib::uikit::{Button, Size};

use crate::{
	brand::{CTA_FACE, Lockup},
	content::{LANGS, Lang, SITE},
};

#[component]
pub fn Header(lang: Lang, path: &'static str) -> Element {
	let t = lang.text();
	rsx! {
		header { class: "panel flex items-center bg-background py-1.5 md:py-5",
			div { class: "flex w-full items-center",
				a { href: lang.href("/"), class: "shrink-0",
					Lockup { mark: "h-[26px] w-[22.5px] md:h-8 md:w-[27.7px] text-primary", word: "text-[20px] md:text-[25px] text-brand" }
				}
				div { class: "flex-1" }
				nav { class: "hidden md:flex items-center gap-[30px] text-[15px] font-medium text-ink-mid",
					for (label , href) in t.nav.iter().copied() {
						a { href: lang.href(href), class: "hover:text-primary", "{label}" }
					}
				}
				div { class: "flex-1 hidden md:block" }
				div { class: "hidden md:flex items-center gap-5",
					LangSwitch { lang, path, class: "text-[13px] font-medium text-ink-mid" }
					a { href: SITE.tel_href(), class: "flex flex-col",
						span { class: "text-[10px] font-medium tracking-[0.12em] text-ink-soft", "{t.header_phone_label}" }
						span { class: "font-display text-[22px] font-bold text-ink", "{SITE.phone}" }
					}
					Button { href: lang.href("/#quote"), size: Size::Xl, class: CTA_FACE, "{t.cta}" }
				}
				details { class: "md:hidden",
					summary { class: "flex size-9 items-center justify-center text-[20px] text-ink", "☰" }
					nav { class: "absolute inset-x-0 z-20 flex flex-col gap-1 border-b border-border bg-background px-[var(--page-px)] py-3 text-[15px] font-medium text-ink-mid shadow-lg",
						for (label , href) in t.nav.iter().copied() {
							a { href: lang.href(href), class: "py-2", "{label}" }
						}
						a { href: SITE.tel_href(), class: "py-2 font-display text-[18px] font-bold text-ink", "{SITE.phone}" }
						LangSwitch { lang, path, class: "py-2 text-[14px] font-medium text-ink-mid" }
					}
				}
			}
		}
	}
}

/// `EN · FR`, linking to the same page in the other language.
///
/// `?lang=` is what mints the cookie server-side, so the choice survives the
/// next unprefixed visit and stops the negotiator from fighting the visitor —
/// and it needs no JavaScript, which is the rule this funnel is built on.
/// `path` is the language-free route (`/prices`), not the current URL: the page
/// already knows it, and taking it as data keeps this renderable without a
/// router context.
#[component]
pub fn LangSwitch(lang: Lang, path: &'static str, class: String) -> Element {
	rsx! {
		span { class: "flex items-center gap-1.5 {class}",
			for (i , other) in LANGS.iter().copied().enumerate() {
				if i > 0 {
					span { class: "opacity-40", "·" }
				}
				a {
					href: "{other.href(path)}?lang={other}",
					class: switch_emphasis(other == lang),
					"{other.tag().to_uppercase()}"
				}
			}
		}
	}
}

fn switch_emphasis(current: bool) -> &'static str {
	if current { "font-semibold" } else { "opacity-60 hover:opacity-100" }
}
