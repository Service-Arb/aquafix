//! The route table and the four page compositions.
//!
//! A page is a `Head` plus a section list. Anything longer than that belongs in
//! a section file.

use dioxus::prelude::*;

use crate::{
	content::{FORBIDDEN, NOT_FOUND, SERVER_ERROR, THANKS, page},
	sections, seo,
	status::StatusScreen,
};

#[derive(Clone, Debug, PartialEq, Routable)]
pub enum Route {
	#[route("/")]
	HomePage {},
	#[route("/prices")]
	PricesPage {},
	#[route("/guarantee")]
	GuaranteePage {},
	#[route("/about")]
	AboutPage {},
	#[route("/thanks")]
	Thanks {},
	#[route("/403")]
	Forbidden {},
	#[route("/500")]
	ServerError {},
	#[route("/:..segments")]
	NotFound { segments: Vec<String> },
}

#[component]
pub fn HomePage() -> Element {
	rsx! {
		seo::Head { page: page("/") }
		sections::EmergencyBar {}
		Shell {
			sections::Hero {}
			sections::ProofBar {}
			sections::Prices {}
			sections::Guarantee {}
			sections::Reviews {}
			sections::ClosingCta {}
		}
		// The fixed bar overlaps the footer; reserve its height back.
		div { class: "h-[66px] md:hidden" }
		sections::BottomCallBar {}
	}
}
#[component]
pub fn PricesPage() -> Element {
	let p = page("/prices");
	rsx! {
		seo::Head { page: p }
		Shell {
			sections::PageHead { page: p }
			sections::Services {}
			sections::Faq {}
			sections::InlineCta {}
		}
	}
}
#[component]
pub fn GuaranteePage() -> Element {
	let p = page("/guarantee");
	rsx! {
		seo::Head { page: p }
		Shell {
			sections::PageHead { page: p }
			sections::Objections {}
			sections::HowItWorks {}
			sections::InlineCta {}
		}
	}
}
#[component]
pub fn AboutPage() -> Element {
	let p = page("/about");
	rsx! {
		seo::Head { page: p }
		Shell {
			sections::PageHead { page: p }
			sections::Crew {}
			sections::ServiceArea {}
			sections::InlineCta {}
		}
	}
}
#[component]
pub fn Thanks() -> Element {
	rsx! {
		seo::NoIndexHead { title: "Request received" }
		StatusScreen { copy: THANKS }
	}
}
#[component]
pub fn Forbidden() -> Element {
	rsx! {
		seo::NoIndexHead { title: "Access denied" }
		StatusScreen { copy: FORBIDDEN }
	}
}
#[component]
pub fn ServerError() -> Element {
	rsx! {
		seo::NoIndexHead { title: "Server error" }
		StatusScreen { copy: SERVER_ERROR }
	}
}
#[component]
pub fn NotFound(segments: Vec<String>) -> Element {
	let _ = segments;
	rsx! {
		seo::NoIndexHead { title: "Page not found" }
		StatusScreen { copy: NOT_FOUND }
	}
}
/// Header → sections → footer, the frame every content page shares.
#[component]
fn Shell(children: Element) -> Element {
	rsx! {
		sections::Header {}
		main { {children} }
		sections::Footer {}
	}
}
