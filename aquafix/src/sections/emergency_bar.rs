//! Figma `3:3` / `26:7`. The only red on the site.

use dioxus::prelude::*;

use crate::content::{Lang, SITE};

#[component]
pub fn EmergencyBar(lang: Lang) -> Element {
	let t = lang.text();
	rsx! {
		div { class: "dark flex items-center justify-center gap-3 bg-background px-[var(--page-px)] py-2.5 md:py-[11px] text-[13px] md:text-[14px]",
			span { class: "size-[9px] shrink-0 rounded-full bg-accent-error" }
			p { class: "truncate text-ink-soft", "{t.emergency_line}" }
			a { href: SITE.tel_href(), class: "shrink-0 font-semibold text-primary", "{SITE.phone}" }
		}
	}
}
