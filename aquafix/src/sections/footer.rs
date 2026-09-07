//! Figma `9:23` / `27:80`. Local, not `ev_lib::uikit::Footer` — that one is
//! EV-shaped, down to its own lockup and link columns.

use dioxus::prelude::*;

use crate::{
	blocks::GUTTER,
	brand::Lockup,
	content::{Lang, SITE},
};

#[component]
pub fn Footer(lang: Lang) -> Element {
	let t = lang.text();
	let (col_services, col_areas, col_company, col_contact) = t.footer_columns;
	rsx! {
		footer { id: "footer", class: "bg-inverse-deep pt-9 md:pt-14 {GUTTER}",
			div { class: "flex flex-col gap-8 md:flex-row md:gap-12",
				div { class: "flex flex-col gap-4 md:w-80 md:gap-[18px]",
					Lockup { mark: "h-[30px] w-[26px] text-accent", word: "text-[23px] text-on-inverse" }
					p { class: "text-[11px] font-medium tracking-[0.16em] text-accent", "{t.promise}" }
					div { class: "flex flex-col gap-[7px] text-[13.5px] text-on-inverse-muted",
						for fact in t.footer_facts {
							p { "{fact}" }
						}
					}
				}
				div { class: "grid grid-cols-2 gap-8 md:flex md:flex-1 md:gap-12",
					Column { heading: col_services,
						for (label , href) in t.footer_services.iter().copied() {
							a { href: lang.href(href), "{label}" }
						}
					}
					Column { heading: col_areas,
						for area in t.footer_areas {
							a { href: lang.href("/about"), "{area}" }
						}
					}
					Column { heading: col_company,
						for (label , href) in t.footer_company.iter().copied() {
							a { href: lang.href(href), "{label}" }
						}
					}
					Column { heading: col_contact,
						a { href: SITE.tel_href(), class: "font-display text-[22px] font-bold text-action", "{SITE.phone}" }
						p { "{t.emergency_hours}" }
						p { "{t.booking_hours}" }
						a { href: "mailto:{SITE.email()}", "{SITE.email()}" }
						p { "{SITE.street}, {SITE.locality} {SITE.region} {SITE.postal_code}" }
					}
				}
			}
			div { class: "mt-8 flex flex-col gap-3 border-t border-rule-inverse pb-7 pt-6 text-[13px] text-on-inverse-muted md:mt-9 md:flex-row md:items-center md:gap-6",
				p { "{SITE.copyright}" }
				div { class: "flex-1" }
				for label in t.footer_legal {
					span { "{label}" }
				}
			}
		}
	}
}
#[component]
fn Column(heading: String, children: Element) -> Element {
	rsx! {
		div { class: "flex flex-1 flex-col gap-3.5",
			p { class: "text-[11px] font-medium tracking-[0.16em] text-on-inverse", "{heading}" }
			div { class: "flex flex-col gap-[11px] text-[14.5px] text-on-inverse-muted", {children} }
		}
	}
}
