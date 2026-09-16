//! The third composition — everything it owns is in this directory.
//!
//! The argument, against `bands` and `field`: those two ask how the page should
//! be dressed, and both answers stretch the drawn 1440 frame across whatever
//! viewport arrives. This one starts from a rule instead — *text gets a measure
//! and stops; only media may fill the viewport* — and from a word budget, which
//! is the half of the problem no stylesheet could reach.
//!
//! Studied from `docs/refs/sites/nampa-roofing/NOTES.md`. Removing this version
//! is this directory, its `const` and `ALL` entry in `compose.rs`, its block in
//! `input.css`, and its case in the flake's `dev`.

mod bands;
mod copy;
mod hero;

use dioxus::prelude::*;

use crate::{
	brand::Lockup,
	compose,
	content::{Lang, SITE},
	quiet::copy::copy,
	sections,
	sections::LangSwitch,
};

/// Read through `compose::QUIET.home`.
pub fn home(lang: Lang) -> Element {
	rsx! {
		div { lang: lang.tag(), class: compose::selected().root,
			Header { lang }
			main {
				hero::Hero { lang }
				bands::Prices { lang }
				bands::Guarantee { lang }
				bands::Reviews { lang }
				bands::Coverage { lang }
				bands::Closing { lang }
			}
			Footer { lang }
		}
		// The header scrolls away with the hero, so without this there is no
		// phone on a mobile screen between the hero and the closing band. The
		// visitor standing in water is the one that costs.
		sections::BottomCallBar { lang }
	}
}

/// Transparent and laid over the photograph, so the hero owns the whole first
/// screen. There is no emergency bar above it: the phone is in the header, in
/// the hero and in the footer, and a fourth copy above the fold was a band.
#[component]
fn Header(lang: Lang) -> Element {
	let t = lang.text();
	rsx! {
		header { class: "absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-[#051726]/75 to-transparent",
			div { class: "flex items-center gap-8 px-[var(--page-px)] py-4 md:py-5",
				a { href: lang.href("/"), class: "shrink-0",
					Lockup { mark: "h-[26px] w-[22.5px] text-primary md:h-7 md:w-[24px]", word: "text-[20px] md:text-[23px] text-white" }
				}
				div { class: "flex-1" }
				nav { class: "hidden items-center gap-8 text-[14.5px] font-medium text-white/85 md:flex",
					for (label , href) in t.nav.iter().copied() {
						a { href: lang.href(href), class: "hover:text-primary", "{label}" }
					}
				}
				LangSwitch { lang, path: "/", class: "hidden text-[13px] font-medium text-white/70 md:block" }
				// No phone here on mobile: the hero's is a thumb's width below it
				// and the bottom bar carries it everywhere else.
				bands::QuoteButton { lang, class: "hidden md:inline-flex" }
			}
		}
	}
}

/// One row of facts and one row of law. The four-column link farm went with the
/// section it duplicated — every page it linked to is in the header.
#[component]
fn Footer(lang: Lang) -> Element {
	let t = lang.text();
	let c = copy(lang);
	rsx! {
		footer { class: "border-t border-border bg-background px-[var(--page-px)] py-10 md:py-14",
			div { class: "quiet-footer flex flex-col gap-8",
				div { class: "flex flex-col gap-6 md:flex-row md:items-start md:justify-between",
					div { class: "flex flex-col gap-3",
						Lockup { mark: "h-7 w-[24px] text-primary", word: "text-[23px] text-brand" }
						a { href: SITE.tel_href(), class: "font-display text-[22px] font-bold text-primary", "{SITE.phone}" }
						p { class: "text-[14px] text-ink-soft", "{t.emergency_hours}" }
					}
					nav { class: "flex flex-wrap gap-x-7 gap-y-2 text-[14.5px] font-medium text-ink-mid",
						for (label , href) in t.nav.iter().copied() {
							a { href: lang.href(href), class: "hover:text-primary", "{label}" }
						}
						a { href: "#", class: "hover:text-primary", "{c.back_to_top}" }
					}
				}
				div { class: "flex flex-col gap-3 border-t border-border pt-6 md:flex-row md:items-center md:justify-between",
					p { class: "text-[12.5px] text-ink-soft", {t.footer_legal.join(" · ")} }
					LangSwitch { lang, path: "/", class: "text-[12.5px] font-medium text-ink-soft" }
				}
			}
		}
	}
}
