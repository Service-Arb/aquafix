#![feature(default_field_values)]
#![doc = include_str!("README.md")]

use dioxus::prelude::*;

pub mod analytics;
pub mod blocks;
pub mod brand;
pub mod content;
pub mod ld;
pub mod pages;
pub mod quote;
pub mod sections;
pub mod seo;
pub mod status;

// The lead store and the `v_utils`-backed config are the server's; neither has
// any business in the bundle the emergency visitor downloads.
#[cfg(not(target_arch = "wasm32"))]
pub mod config;
#[cfg(not(target_arch = "wasm32"))]
pub mod store;

/// Tailwind's output, built from `input.css` by the flake (dev watch, and every
/// release build's `postPatch`) so it can never be a stale committed copy.
const TAILWIND: Asset = asset!("/assets/tailwind.css");

#[component]
pub fn App() -> Element {
	rsx! {
		document::Link { rel: "stylesheet", href: TAILWIND }
		document::Meta { name: "viewport", content: "width=device-width, initial-scale=1" }
		brand::Fonts {}
		analytics::Provider { api_key: posthog_key(),
			Router::<pages::Route> {}
		}
	}
}

/// The PostHog project key, or `None` — in which case capture is a silent
/// no-op. Read from the environment at compile time so the wasm carries it
/// without a round trip.
fn posthog_key() -> Option<String> {
	option_env!("POSTHOG_KEY").map(str::to_string)
}
