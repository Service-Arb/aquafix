//! The five bands under the hero.
//!
//! Every figure, price, review and place name is read from `content.rs`; only
//! the framing line above each band belongs to this version. A band here is one
//! heading and one object — there is no lede under a title that the title
//! already made, which is most of what the word count lost.

use dioxus::prelude::*;
use ev_lib::uikit::{Button, Polarity, Section, Size, Surface, Table, TableBody, TableCell, TableHead, TableHeader, TableRow};

use crate::{
	brand::CTA_FACE,
	content::{Lang, SITE},
	quiet::copy::copy,
	quote::QuoteCard,
};

/// The four job photographs, in caption order. Paired with `Copy::work_captions`
/// by index — a `[_; 4]` on both sides so a photo added without a label, or the
/// reverse, does not compile.
const WORK: [Asset; 4] = [
	asset!("/assets/photos/job-under-sink.jpg"),
	asset!("/assets/photos/job-tap-shower.jpg"),
	asset!("/assets/photos/job-hot-water.jpg"),
	asset!("/assets/photos/job-pipe-repair.jpg"),
];

/// Photographs with a label each, and the detail behind a disclosure. Nam Pa
/// gives its portfolio a band of its own directly under the hero, and that is
/// what makes the page feel unhurried — the space is filled by something worth
/// looking at rather than by more sentences.
///
/// The detail opens in a native `popover`, not in flow. A `<details>` that grows
/// inside the grid was the first attempt: to give the prose a readable measure
/// the open card has to span the row, and spanning reflows the row, stranding
/// whatever card sat beside it. The popover leaves the grid still.
///
/// `popover` and `popovertarget` are the platform's own — click to open, click
/// outside or Escape to dismiss, focus and top-layer handled — so this costs no
/// script and works before any wasm arrives, which is the rule the FAQ and the
/// drawer already follow. Without support the button is inert rather than
/// broken; the caption and photograph still say what the card is.
#[component]
pub fn Work(lang: Lang) -> Element {
	let c = copy(lang);
	rsx! {
		Section { id: "work",
			div { class: "flex flex-col gap-7 md:gap-10",
				BandHead { title: c.work_title }
				ul { class: "grid grid-cols-2 items-start gap-3 md:grid-cols-4 md:gap-5",
					for (i , ((photo , caption) , body)) in WORK.iter().zip(c.work_captions.iter()).zip(c.work_bodies.iter()).enumerate() {
						li { class: "group flex flex-col gap-3",
							button {
								"popovertarget": "work-{i}",
								class: "flex cursor-pointer flex-col gap-3 text-left",
								div { class: "overflow-hidden rounded-[var(--corner-card)] bg-muted",
									img {
										src: "{photo}",
										alt: "{caption}",
										loading: "lazy",
										decoding: "async",
										// Square rather than the sources' own landscape: four
										// 4:3 frames inside the measure read as thumbnails
										// against this band's rhythm, and the subject is
										// centred in all four.
										class: "aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]",
									}
								}
								span { class: "text-[13px] font-medium text-ink md:text-[14.5px]", "{caption}" }
								span { class: "text-[12px] font-medium text-primary md:text-[13px]", "{c.work_more}  →" }
							}
							div { id: "work-{i}", "popover": "auto", class: "work-pop",
								img {
									src: "{photo}",
									alt: "",
									class: "h-40 w-full rounded-[var(--corner-tile)] object-cover md:h-48",
								}
								h3 { class: "mt-5 font-display text-[21px] font-bold text-ink md:text-[26px]", "{caption}" }
								p { class: "mt-3 text-[14.5px] leading-[1.65] text-ink-mid md:text-[16px]", "{body}" }
								button {
									"popovertarget": "work-{i}",
									"popovertargetaction": "hide",
									class: "mt-6 self-start rounded-[var(--corner-control)] border border-border px-4 py-2 text-[13.5px] font-medium text-ink-mid hover:text-ink",
									"{c.work_close}"
								}
							}
						}
					}
				}
			}
		}
	}
}

/// The band the whole page is argued from: nobody else publishes a price.
#[component]
pub fn Prices(lang: Lang) -> Element {
	let t = lang.text();
	let c = copy(lang);
	let (col_job, col_price, col_time) = t.price_columns;
	rsx! {
		Section { id: "prices",
			div { class: "flex flex-col gap-7 md:gap-9",
				BandHead { title: c.prices_title }
				div { class: "overflow-hidden rounded-[var(--corner-card)] border border-border",
					Table { class: "border-collapse text-left",
						TableHeader {
							TableRow { class: "bg-muted text-[10.5px] font-medium tracking-[0.14em] text-ink-soft md:text-[11px]",
								TableHead { class: "h-auto px-4 py-3 font-medium text-ink-soft md:px-7 md:py-4", "{col_job}" }
								TableHead { class: "h-auto px-4 py-3 text-right font-medium text-ink-soft md:w-[180px] md:px-7 md:py-4", "{col_price}" }
								TableHead { class: "hidden h-auto w-[190px] px-7 py-4 text-right font-medium text-ink-soft md:table-cell", "{col_time}" }
							}
						}
						TableBody {
							for row in t.prices {
								TableRow {
									TableCell { class: "px-4 py-3.5 text-[14.5px] font-semibold text-ink md:px-7 md:text-[16px]", "{row.job}" }
									TableCell { class: "px-4 py-3.5 text-right font-display font-num text-[17px] font-bold text-primary md:px-7 md:text-[19px]",
										"{row.from_display()}"
									}
									TableCell { class: "hidden px-7 py-3.5 text-right text-[15px] text-ink-soft md:table-cell",
										"{row.typical_time}"
									}
								}
							}
						}
					}
				}
				p { class: "text-[13.5px] text-ink-soft md:text-[14.5px]", "{c.prices_note}" }
			}
		}
	}
}

/// Three terms, no prose. A pillar's `body` is the argument for the term; the
/// term is the promise, and on this version only the promise is on the page.
#[component]
pub fn Guarantee(lang: Lang) -> Element {
	let t = lang.text();
	let c = copy(lang);
	rsx! {
		Section { polarity: Polarity::Dark, surface: Surface::Card, id: "guarantee",
			div { class: "flex flex-col gap-7 md:gap-10",
				BandHead { title: c.guarantee_title }
				ol { class: "flex flex-col gap-0 md:flex-row md:gap-14",
					for pillar in t.pillars {
						li { class: "flex flex-1 items-baseline gap-4 border-b border-border py-5 last:border-b-0 md:border-b-0 md:py-0",
							span { class: "font-display font-num text-[22px] font-bold text-primary md:text-[26px]", "{pillar.n}" }
							p { class: "font-display text-[17px] font-bold leading-[1.3] text-ink md:text-[21px]", "{pillar.title}" }
						}
					}
				}
			}
		}
	}
}

#[component]
pub fn Reviews(lang: Lang) -> Element {
	let t = lang.text();
	let c = copy(lang);
	rsx! {
		Section { surface: Surface::Card, id: "reviews",
			div { class: "flex flex-col gap-7 md:gap-10",
				BandHead { title: c.reviews_title }
				div { class: "flex flex-col gap-5 md:flex-row md:gap-6",
					for review in t.reviews {
						figure { class: "flex flex-1 flex-col gap-3.5 rounded-[var(--corner-card)] border border-border bg-background p-6 md:p-7",
							p { class: "text-[13px] tracking-[0.18em] text-primary", {"★".repeat(review.stars as usize)} }
							blockquote { class: "text-[14.5px] leading-[1.6] text-ink-mid md:text-[15.5px]", "{review.body}" }
							figcaption { class: "mt-auto text-[13px] font-semibold text-ink",
								"{review.author}"
								span { class: "font-normal text-ink-soft", " · {review.attrib}" }
							}
						}
					}
				}
			}
		}
	}
}

/// New on this version. Nam Pa gives the city list a band of its own because a
/// visitor's first question is whether you come to them at all.
#[component]
pub fn Coverage(lang: Lang) -> Element {
	let t = lang.text();
	let c = copy(lang);
	rsx! {
		Section { id: "areas",
			div { class: "flex flex-col gap-6 md:gap-8",
				BandHead { title: c.coverage_title, lede: c.coverage_lede }
				ul { class: "flex flex-wrap gap-2 md:gap-2.5",
					for area in t.areas.iter().copied() {
						li { class: "rounded-full border border-border bg-muted px-4 py-2 text-[13.5px] font-medium text-ink-mid md:text-[14.5px]",
							"{area}"
						}
					}
				}
			}
		}
	}
}

/// The form lands here rather than in the hero: the emergency path is the phone,
/// and a visitor who has read the prices is the one who fills a form in.
#[component]
pub fn Closing(lang: Lang) -> Element {
	let c = copy(lang);
	rsx! {
		Section { polarity: Polarity::Dark, id: "quote-band",
			div { class: "flex flex-col gap-8 md:flex-row md:items-start md:gap-14",
				div { class: "flex flex-1 flex-col gap-4 md:gap-5 md:pt-2",
					h2 { class: "font-display text-[28px] font-bold leading-[1.1] tracking-[-0.01em] text-ink md:text-[40px]",
						"{c.closing_title}"
					}
					p { class: "text-[15.5px] leading-[1.6] text-ink-soft md:text-[17px]", "{c.closing_lede}" }
					a {
						href: SITE.tel_href(),
						class: "font-display text-[22px] font-bold text-primary md:text-[26px]",
						"{SITE.phone}"
					}
				}
				div { class: "w-full md:max-w-[460px]",
					QuoteCard { lang }
				}
			}
		}
	}
}

/// One heading, optionally one line. The version's whole density argument is
/// that a band gets at most these two things before its object starts.
#[component]
fn BandHead(title: String, lede: Option<String>) -> Element {
	rsx! {
		div { class: "flex flex-col gap-3 md:gap-4",
			h2 { class: "font-display text-[26px] font-bold leading-[1.12] tracking-[-0.01em] text-ink md:text-[38px]",
				"{title}"
			}
			if let Some(lede) = lede {
				p { class: "max-w-[52ch] text-[15px] leading-[1.6] text-ink-soft md:text-[17px]", "{lede}" }
			}
		}
	}
}

/// Shared by the header and the closing band so the label cannot drift.
#[component]
pub fn QuoteButton(lang: Lang, class: String) -> Element {
	let c = copy(lang);
	rsx! {
		Button { href: lang.href("/#quote"), size: Size::Lg, class: "{CTA_FACE} {class}", "{c.cta}" }
	}
}
