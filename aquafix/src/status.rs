//! Figma `16:6`/`16:51`/`16:96` desktop, `17:11`/`17:48`/`17:85` mobile.
//!
//! One component over a [`StatusCopy`]; the three error pages and the
//! post-submit confirmation differ only in eyebrow, numeral, headline and their
//! two buttons. A visitor who hit a 404 still gets the offer — hence the
//! guarantee strip, which is the hero's three terms compressed.

use dioxus::prelude::*;

use crate::{
	blocks::{Cta, CtaButton, LangSwitch, PANEL, Tick},
	brand::{Lockup, Mark},
	content::{Lang, SITE, StatusCopy},
};

#[component]
pub fn StatusScreen(copy: ReadSignal<StatusCopy>, lang: Lang, path: &'static str) -> Element {
	let copy = copy();
	let t = lang.text();
	commit(copy.code);
	let (lead, accent) = copy.headline;
	rsx! {
		div {
			lang: lang.tag(),
			class: "flex min-h-screen flex-col bg-surface p-4 sm:p-[38px]",
			div { class: "{PANEL} relative flex flex-1 flex-col overflow-hidden bg-inverse-deep",
				// The design's glow. A radial gradient, not an asset — one less request.
				div { class: "pointer-events-none absolute inset-x-0 top-24 h-[760px] bg-[radial-gradient(ellipse_at_center,rgba(194,112,61,0.16),transparent_65%)]" }
				header { class: "relative flex items-center border-b border-rule-inverse py-4 md:py-[22px]",
					a { href: lang.href("/"),
						Lockup {
							mark: "h-[30px] w-[26px] text-accent",
							word: "text-[23px] text-on-inverse",
						}
					}
					div { class: "flex-1" }
					nav { class: "hidden md:flex items-center gap-7 text-[14px] font-medium text-on-inverse-muted",
						for (label, href) in t.nav.iter().copied() {
							a { href: lang.href(href), "{label}" }
						}
					}
					div { class: "flex-1 hidden md:block" }
					LangSwitch {
						lang,
						path,
						class: "mr-5 text-[13px] font-medium text-on-inverse-muted",
					}
					a {
						href: SITE.tel_href(),
						class: "font-display text-[16px] md:text-[20px] font-bold text-action",
						"{SITE.phone}"
					}
				}
				main { class: "relative flex flex-1 flex-col items-center gap-5 px-5 py-12 text-center md:gap-6 md:py-[110px]",
					Mark { class: "h-[54px] w-[47px] text-accent" }
					p { class: "text-[11px] md:text-[12px] font-medium tracking-[0.22em] text-accent",
						"{copy.eyebrow}"
					}
					p { class: "font-display font-num text-[88px] md:text-[150px] font-bold leading-none tracking-[-0.02em] text-on-inverse",
						"{copy.code}"
					}
					p { class: "font-display text-[26px] md:text-[40px] font-bold leading-[1.25] text-on-inverse",
						"{lead}"
						span { class: "text-accent", "{accent}" }
					}
					p { class: "max-w-[41rem] text-[15px] md:text-[17px] leading-[1.6] text-on-inverse-muted",
						"{copy.body}"
					}
					div { class: "flex flex-col gap-3.5 sm:flex-row",
						CtaButton { kind: Cta::Primary, href: copy.primary.href(lang),
							"{copy.primary.label(t)}"
						}
						CtaButton {
							kind: Cta::Outline,
							href: copy.secondary.href(lang),
							"{copy.secondary.label(t)}"
						}
					}
					div { class: "flex flex-col items-center gap-3 text-[14px] sm:flex-row sm:gap-[26px]",
						for term in t.status_strip {
							span { class: "flex items-center gap-2",
								Tick {}
								span { class: "font-medium text-on-inverse-muted", "{term}" }
							}
						}
					}
				}
				footer { class: "relative flex flex-col gap-3 border-t border-rule-inverse py-6 text-[11.5px] tracking-[0.08em] text-on-inverse-muted md:flex-row md:items-center md:py-7",
					p {
						"{SITE.copyright.to_uppercase()} · OREGON CCB {SITE.ccb} · LICENCE {SITE.licence}"
					}
					div { class: "flex-1" }
					div { class: "flex gap-[26px]",
						for label in t.status_legal {
							span { "{label}" }
						}
					}
				}
			}
		}
	}
}
/// Sets the real HTTP status on the SSR response. Without it every status page
/// answers 200, and a soft 404 is worse than a hard one: a crawler indexes the
/// error page and keeps the dead URL in the index.
#[cfg(not(target_arch = "wasm32"))]
fn commit(code: &str) {
	use dioxus::{fullstack::FullstackContext, server::http::StatusCode};
	let status = match code {
		"404" => StatusCode::NOT_FOUND,
		"403" => StatusCode::FORBIDDEN,
		"500" => StatusCode::INTERNAL_SERVER_ERROR,
		// `/thanks` is a real, successful page; only the error codes map.
		_ => return,
	};
	FullstackContext::commit_http_status(status, None);
}

#[cfg(target_arch = "wasm32")]
fn commit(_code: &str) {}
