//! Figma `6:4` / `27:7`.
//!
//! The single largest differentiator in the design: no reference site publishes
//! an actual price list. It is a real `<table>` so a screen reader and a
//! crawler both read it as one; mobile drops the time column rather than
//! restacking, which keeps one markup tree.

use dioxus::prelude::*;

use crate::{
	blocks::{Section, SectionHead, Tick, Tone},
	content::{PRICE_HEAD, PRICE_NOTE, PRICE_NOTE_SHORT, PRICES},
};

#[component]
pub fn Prices() -> Element {
	let (eyebrow, title, lede) = PRICE_HEAD;
	rsx! {
		Section { tone: Tone::Subtle, id: "prices",
			div { class: "flex flex-col gap-5 md:gap-7",
				SectionHead { tone: Tone::Subtle, eyebrow, title, lede }
				div { class: "overflow-hidden rounded-[14px] border border-rule bg-surface",
					table { class: "w-full border-collapse text-left",
						thead {
							tr { class: "border-b border-rule bg-mist text-[10.5px] md:text-[11.5px] font-medium tracking-[0.14em] text-ink-soft",
								th { class: "px-4 py-3 md:px-[30px] md:py-4 font-medium", "JOB" }
								th { class: "px-4 py-3 md:px-[30px] md:py-4 text-right font-medium md:w-[190px]", "FLAT PRICE FROM" }
								th { class: "hidden md:table-cell px-[30px] py-4 text-right font-medium w-[200px]", "TYPICAL TIME ON SITE" }
							}
						}
						tbody {
							for row in PRICES {
								tr { class: "border-b border-rule",
									td { class: "px-4 py-3 md:px-[30px] md:py-3.5 text-[14px] md:text-[16px] font-semibold text-ink",
										"{row.job}"
									}
									td { class: "px-4 py-3 md:px-[30px] md:py-3.5 text-right font-display font-num text-[17px] md:text-[19px] font-bold text-accent",
										"{row.from_display()}"
									}
									td { class: "hidden md:table-cell px-[30px] py-3.5 text-right text-[15px] text-ink-soft",
										"{row.typical_time}"
									}
								}
							}
						}
					}
					div { class: "flex items-start gap-3 bg-mist px-4 py-4 md:px-[30px] md:pb-[22px] md:pt-5",
						Tick {}
						p { class: "text-[13.5px] md:text-[14.5px] font-medium leading-[1.55] text-ink-mid",
							span { class: "md:hidden", "{PRICE_NOTE_SHORT}" }
							span { class: "hidden md:inline", "{PRICE_NOTE}" }
						}
					}
				}
			}
		}
	}
}
