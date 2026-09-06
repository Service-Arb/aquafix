//! Figma `5:4` / `26:64`. Licence and insurance up front — one of the four
//! mechanics the highest-review operators independently converged on.

use dioxus::prelude::*;

use crate::content::PROOF;

#[component]
pub fn ProofBar() -> Element {
	rsx! {
		div { class: "grid grid-cols-2 gap-x-6 gap-y-4 border-b border-rule bg-subtle px-5 py-4 md:flex md:items-center md:justify-between md:px-30 md:py-6",
			for stat in PROOF {
				div { class: "flex flex-col gap-1",
					span { class: "text-[10px] md:text-[10.5px] font-medium tracking-[0.14em] text-ink-soft", "{stat.label}" }
					span { class: "text-[14px] md:text-[15px] font-semibold text-ink", "{stat.value}" }
				}
			}
		}
	}
}
