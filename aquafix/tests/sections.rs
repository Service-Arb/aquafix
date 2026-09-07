//! Layer 1 of `tmp/site_dev_plans/testing.md`: render each section natively
//! through `dioxus_ssr` and snapshot the HTML.
//!
//! This layer is allowed to catch structure and class drift — a token rename
//! that silently drops a colour, a section that stops emitting its anchor. It
//! is not allowed to be asked about anything visual; that is Playwright's.
//!
//! One French snapshot, not nineteen: French renders the same structure, so a
//! second full set would only restate this one. `hero_fr` is here to prove the
//! prop reaches a leaf.
//!
//! Never hand-edit a `.snap`. Run `cargo insta accept` and read the diff.

use aquafix::{content::Lang, sections::*};
use dioxus::prelude::*;

fn render(app: fn() -> Element) -> String {
	let mut dom = VirtualDom::new(app);
	dom.rebuild_in_place();
	dioxus_ssr::render(&dom)
}

macro_rules! snapshot {
	($name:ident, $body:expr) => {
		#[test]
		fn $name() {
			fn app() -> Element {
				$body
			}
			insta::assert_snapshot!(render(app));
		}
	};
}

snapshot!(emergency_bar, rsx! { EmergencyBar { lang: Lang::En } });
snapshot!(header, rsx! { Header { lang: Lang::En, path: "/" } });
snapshot!(hero, rsx! { Hero { lang: Lang::En } });
snapshot!(hero_fr, rsx! { Hero { lang: Lang::Fr } });
snapshot!(proof_bar, rsx! { ProofBar { lang: Lang::En } });
snapshot!(prices, rsx! { Prices { lang: Lang::En } });
snapshot!(guarantee, rsx! { Guarantee { lang: Lang::En } });
snapshot!(reviews, rsx! { Reviews { lang: Lang::En } });
snapshot!(closing_cta, rsx! { ClosingCta { lang: Lang::En } });
snapshot!(footer, rsx! { Footer { lang: Lang::En } });
snapshot!(bottom_call_bar, rsx! { BottomCallBar { lang: Lang::En } });
snapshot!(services, rsx! { Services { lang: Lang::En } });
snapshot!(faq, rsx! { Faq { lang: Lang::En } });
snapshot!(objections, rsx! { Objections { lang: Lang::En } });
snapshot!(how_it_works, rsx! { HowItWorks { lang: Lang::En } });
snapshot!(crew, rsx! { Crew { lang: Lang::En } });
snapshot!(service_area, rsx! { ServiceArea { lang: Lang::En } });
snapshot!(inline_cta, rsx! { InlineCta { lang: Lang::En } });
snapshot!(page_head_prices, rsx! { PageHead { page: Lang::En.page("/prices") } });

snapshot!(status_not_found, rsx! { aquafix::status::StatusScreen { copy: aquafix::content::EN.not_found, lang: Lang::En, path: "/" } });
