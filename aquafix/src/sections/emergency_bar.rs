//! Figma `3:3` / `26:7`. The only red on the site.
//!
//! Sized to its sentence rather than to the viewport: it is one line of copy,
//! and a bar that spans a 1920px screen to hold sixty characters reads as the
//! chrome a visitor has already learned to skip.

use dioxus::prelude::*;

use crate::{blocks::PhoneLink, content::Lang};

#[component]
pub fn EmergencyBar(lang: Lang) -> Element {
	let t = lang.text();
	rsx! {
		div { class: "mx-auto flex w-fit max-w-full items-center gap-2 rounded-full bg-inverse-deep px-3.5 py-1 text-[13px] md:gap-3 md:px-6 md:py-2.5 md:text-[14px]",
			span { class: "size-[9px] shrink-0 rounded-full bg-danger" }
			p { class: "truncate text-on-inverse-muted",
				span { class: "md:hidden", "{t.emergency_line_short}" }
				span { class: "hidden md:inline", "{t.emergency_line}" }
			}
			PhoneLink { class: "shrink-0 font-semibold text-action" }
		}
	}
}
