//! The route table and the four page compositions, each at two URLs.
//!
//! A page is a `Head` plus a section list. Anything longer than that belongs in
//! a section file.
//!
//! Every route exists twice: unprefixed (English, canonical) and under
//! `/:lang`. Dioxus' `#[route(path, Component)]` names the component, so both
//! shapes share one. The macro checks static segments before dynamic ones and
//! dynamic before the catch-all, and a segment that fails to parse falls
//! through to the next candidate — so `/prices` takes the static arm,
//! `/fr/prices` the dynamic one, and `/en/prices` reaches `NotFound` (the
//! middleware 301s it to the canonical URL before it can).

use dioxus::prelude::*;

use crate::{content::Lang, sections, seo, status::StatusScreen};

#[derive(Clone, Debug, PartialEq, Routable)]
pub enum Route {
	#[route("/", HomePage)]
	HomeEn {},
	#[route("/:lang", HomePage)]
	HomeLoc { lang: Lang },
	#[route("/prices", PricesPage)]
	PricesEn {},
	#[route("/:lang/prices", PricesPage)]
	PricesLoc { lang: Lang },
	#[route("/guarantee", GuaranteePage)]
	GuaranteeEn {},
	#[route("/:lang/guarantee", GuaranteePage)]
	GuaranteeLoc { lang: Lang },
	#[route("/about", AboutPage)]
	AboutEn {},
	#[route("/:lang/about", AboutPage)]
	AboutLoc { lang: Lang },
	#[route("/thanks", Thanks)]
	ThanksEn {},
	#[route("/:lang/thanks", Thanks)]
	ThanksLoc { lang: Lang },
	#[route("/403", Forbidden)]
	ForbiddenEn {},
	#[route("/:lang/403", Forbidden)]
	ForbiddenLoc { lang: Lang },
	#[route("/500", ServerError)]
	ServerErrorEn {},
	#[route("/:lang/500", ServerError)]
	ServerErrorLoc { lang: Lang },
	#[route("/:..segments")]
	NotFound { segments: Vec<String> },
}

// `#[props(default = Lang::En)]` is the one honest default in the tree: an
// unprefixed URL *means* English. Nothing below a page takes one, so a section
// that forgets to thread `lang` is a compile error, not a silent English patch
// inside a French page.

#[component]
pub fn HomePage(#[props(default = Lang::En)] lang: Lang) -> Element {
	rsx! {
		seo::Head { page: lang.page("/"), lang }
		sections::EmergencyBar { lang }
		Shell { lang, path: "/",
			sections::Hero { lang }
			sections::ProofBar { lang }
			sections::Prices { lang }
			sections::Guarantee { lang }
			sections::Reviews { lang }
			sections::ClosingCta { lang }
		}
		// The fixed bar overlaps the footer; reserve its height back.
		div { class: "h-[66px] md:hidden" }
		sections::BottomCallBar { lang }
	}
}
#[component]
pub fn PricesPage(#[props(default = Lang::En)] lang: Lang) -> Element {
	let p = lang.page("/prices");
	rsx! {
		seo::Head { page: p, lang }
		Shell { lang, path: p.path,
			sections::PageHead { page: p }
			sections::Services { lang }
			sections::Faq { lang }
			sections::InlineCta { lang }
		}
	}
}
#[component]
pub fn GuaranteePage(#[props(default = Lang::En)] lang: Lang) -> Element {
	let p = lang.page("/guarantee");
	rsx! {
		seo::Head { page: p, lang }
		Shell { lang, path: p.path,
			sections::PageHead { page: p }
			sections::Objections { lang }
			sections::HowItWorks { lang }
			sections::InlineCta { lang }
		}
	}
}
#[component]
pub fn AboutPage(#[props(default = Lang::En)] lang: Lang) -> Element {
	let p = lang.page("/about");
	rsx! {
		seo::Head { page: p, lang }
		Shell { lang, path: p.path,
			sections::PageHead { page: p }
			sections::Crew { lang }
			sections::ServiceArea { lang }
			sections::InlineCta { lang }
		}
	}
}
#[component]
pub fn Thanks(#[props(default = Lang::En)] lang: Lang) -> Element {
	let copy = lang.text().thanks;
	rsx! {
		seo::NoIndexHead { title: copy.title }
		StatusScreen { copy, lang, path: "/thanks" }
	}
}
#[component]
pub fn Forbidden(#[props(default = Lang::En)] lang: Lang) -> Element {
	let copy = lang.text().forbidden;
	rsx! {
		seo::NoIndexHead { title: copy.title }
		StatusScreen { copy, lang, path: "/403" }
	}
}
#[component]
pub fn ServerError(#[props(default = Lang::En)] lang: Lang) -> Element {
	let copy = lang.text().server_error;
	rsx! {
		seo::NoIndexHead { title: copy.title }
		StatusScreen { copy, lang, path: "/500" }
	}
}
/// The catch-all never reaches a `/:lang` arm, so it reads the prefix itself —
/// `/fr/nonsense` is a French 404.
#[component]
pub fn NotFound(segments: Vec<String>) -> Element {
	let lang: Lang = segments.first().and_then(|s| s.parse().ok()).unwrap_or_default();
	let copy = lang.text().not_found;
	rsx! {
		seo::NoIndexHead { title: copy.title }
		// A dead URL has no twin in the other language; the switcher goes home.
		StatusScreen { copy, lang, path: "/" }
	}
}
/// Header → sections → footer, the frame every content page shares.
#[component]
fn Shell(lang: Lang, path: &'static str, children: Element) -> Element {
	rsx! {
		div { lang: lang.tag(),
			sections::Header { lang, path }
			main { {children} }
			sections::Footer { lang }
		}
	}
}
