//! Layer 1 of `tmp/site_dev_plans/testing.md`: render each section natively
//! through `dioxus_ssr` and snapshot the HTML.
//!
//! This layer is allowed to catch structure and class drift — a token rename
//! that silently drops a colour, a section that stops emitting its anchor. It
//! is not allowed to be asked about anything visual; that is Playwright's.
//!
//! Never hand-edit a `.snap`. Run `cargo insta accept` and read the diff.

use aquafix::{content::page, sections::*};
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

snapshot!(emergency_bar, rsx! { EmergencyBar {} });
snapshot!(header, rsx! { Header {} });
snapshot!(hero, rsx! { Hero {} });
snapshot!(proof_bar, rsx! { ProofBar {} });
snapshot!(prices, rsx! { Prices {} });
snapshot!(guarantee, rsx! { Guarantee {} });
snapshot!(reviews, rsx! { Reviews {} });
snapshot!(closing_cta, rsx! { ClosingCta {} });
snapshot!(footer, rsx! { Footer {} });
snapshot!(bottom_call_bar, rsx! { BottomCallBar {} });
snapshot!(services, rsx! { Services {} });
snapshot!(faq, rsx! { Faq {} });
snapshot!(objections, rsx! { Objections {} });
snapshot!(how_it_works, rsx! { HowItWorks {} });
snapshot!(crew, rsx! { Crew {} });
snapshot!(service_area, rsx! { ServiceArea {} });
snapshot!(inline_cta, rsx! { InlineCta {} });
snapshot!(page_head_prices, rsx! { PageHead { page: page("/prices") } });

snapshot!(status_not_found, rsx! { aquafix::status::StatusScreen { copy: aquafix::content::NOT_FOUND } });
