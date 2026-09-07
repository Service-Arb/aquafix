//! Figma `8:50`. The refusal is the point: a window we cannot hit is worth
//! nothing, so the radius is published and everything past it is turned down.

use dioxus::prelude::*;

use ev_lib::uikit::{Badge, BadgeVariant, Display, Eyebrow, Section};

use crate::content::Lang;

#[component]
pub fn ServiceArea(lang: Lang) -> Element {
	let t = lang.text();
	let (eyebrow, title, lede) = t.area_head;
	rsx! {
		Section { id: "areas", tight: true,
			div { class: "flex flex-col gap-6 md:flex-row md:gap-14",
				div { class: "flex flex-col gap-3 md:w-[500px] md:gap-3.5",
					Eyebrow { "{eyebrow}" }
					Display { "{title}" }
					p { class: "text-[15px] md:text-[16.5px] leading-[1.62] text-ink-soft", "{lede}" }
				}
				div { class: "flex flex-1 flex-wrap content-start gap-2.5",
					for area in t.areas {
						// `Badge` is the right thing — a small labelled chip — at the wrong
						// shape, so only the shape is overridden.
						Badge { variant: BadgeVariant::Outline, class: "rounded-full bg-card px-4 py-2.5 text-[14px] text-ink-mid", "{area}" }
					}
				}
			}
		}
	}
}
