//! Figma `8:50`. The refusal is the point: a window we cannot hit is worth
//! nothing, so the radius is published and everything past it is turned down.

use dioxus::prelude::*;

use crate::{
	blocks::{Eyebrow, Head, Pill, Tone},
	content::Lang,
};

#[component]
pub fn ServiceArea(lang: Lang) -> Element {
	let t = lang.text();
	let (eyebrow, title, lede) = t.area_head;
	rsx! {
		section { id: "areas", class: "bg-surface px-5 py-8 md:px-30 md:py-14",
			div { class: "flex flex-col gap-6 md:flex-row md:gap-14",
				div { class: "flex flex-col gap-3 md:w-[500px] md:gap-3.5",
					Eyebrow { "{eyebrow}" }
					Head { "{title}" }
					p { class: "text-[15px] md:text-[16.5px] leading-[1.62] {Tone::Base.muted()}", "{lede}" }
				}
				div { class: "flex flex-1 flex-wrap content-start gap-2.5",
					for area in t.areas {
						Pill { "{area}" }
					}
				}
			}
		}
	}
}
