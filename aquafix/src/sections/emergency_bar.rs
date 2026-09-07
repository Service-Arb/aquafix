//! Figma `3:3` / `26:7`. The only red on the site.

use dioxus::prelude::*;

use crate::{blocks::PhoneLink, content::Lang};

#[component]
pub fn EmergencyBar(lang: Lang) -> Element {
	let t = lang.text();
	rsx! {
		div { class: "flex items-center justify-center gap-3 bg-inverse-deep px-5 py-2.5 md:px-30 md:py-[11px] text-[13px] md:text-[14px]",
			span { class: "size-[9px] shrink-0 rounded-full bg-danger" }
			p { class: "truncate text-on-inverse-muted", "{t.emergency_line}" }
			PhoneLink { class: "shrink-0 font-semibold text-action" }
		}
	}
}
