//! Figma `5:4` / `26:64`. Licence and insurance up front — one of the four
//! mechanics the highest-review operators independently converged on.
//!
//! Six tiles on a subtle panel, the shape `hyros.com` gives the same job: the
//! numbers read as separate facts rather than as one run-on line.

use dioxus::prelude::*;

use crate::{
	blocks::{Section, TILE, Tone},
	content::Lang,
};

#[component]
pub fn ProofBar(lang: Lang) -> Element {
	rsx! {
		Section { tone: Tone::Subtle, tight: true,
			div { class: "grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-6 md:gap-3",
				for stat in lang.text().proof {
					div { class: "flex flex-col gap-1 {TILE} bg-surface px-4 py-3.5 md:py-4",
						span { class: "text-[10px] font-medium tracking-[0.14em] text-ink-soft",
							"{stat.label}"
						}
						span { class: "text-balance text-[14px] font-semibold text-ink", "{stat.value}" }
					}
				}
			}
		}
	}
}
