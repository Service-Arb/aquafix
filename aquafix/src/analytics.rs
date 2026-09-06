//! PostHog capture over `fetch`, wrapped so a section file never writes a `cfg`.
//!
//! This started as `ev_lib::analytics` — the right call on shape (typed events,
//! no JS SDK, no autocapture, no third-party script) but not on cost: it POSTs
//! through `reqwest`, which measured **236 KB of the 1.03 MB release wasm**, or
//! 23% of the bundle, for five events. On a page whose visitor is on mobile
//! data in the middle of an emergency that is not a defensible price, and the
//! wasm budget exists to say so. The payload below is byte-identical to what
//! `ev_lib::analytics::capture_body` builds, so moving back is a small diff if
//! that transport ever gets cheaper.
//!
//! Analytics records; it never decides what renders. Capture is fire-and-forget
//! and no-ops with no key configured, so a blocked request cannot affect a page
//! whose whole purpose is a phone call.

use dioxus::prelude::*;

/// Event names, so a typo cannot silently create a second series. snake_case
/// `<surface>_<thing>_<action>`, properties primitive and PII-free.
pub const QUOTE_SUBMITTED: &str = "hero_quote_submitted";
pub const HERO_PHONE: &str = "hero_phone_clicked";
pub const CALLBAR_PHONE: &str = "callbar_phone_clicked";
pub const PRICES_ROW: &str = "prices_row_expanded";
pub const FAQ_OPENED: &str = "faq_question_opened";

/// Mounted once at the app root. With no key, capture is a silent no-op — which
/// is the state every test and every SSR render runs in.
#[component]
pub fn Provider(#[props(default)] api_key: Option<String>, children: Element) -> Element {
	use_context_provider(|| Key(api_key));
	rsx! { {children} }
}
/// Fire-and-forget. Call from an event handler in an interactive leaf.
pub fn capture(name: &'static str, props: &[(&'static str, &str)]) {
	let Some(Key(Some(key))) = try_consume_context::<Key>() else {
		return;
	};
	let mut properties = serde_json::Map::new();
	for (k, v) in props {
		properties.insert((*k).to_string(), serde_json::Value::String((*v).to_string()));
	}
	properties.insert("$lib".to_string(), serde_json::Value::String("aquafix".to_string()));
	let body = serde_json::json!({
		"api_key": key,
		"event": name,
		"distinct_id": distinct_id(),
		"properties": properties,
	});
	send(&body.to_string());
}
/// The project key, in context so `capture` can read it from any leaf.
#[derive(Clone, PartialEq)]
struct Key(Option<String>);

/// `sendBeacon`, not `fetch`: it is purpose-built for fire-and-forget telemetry
/// and, unlike a plain fetch, it survives the navigation away. Half the events
/// here are clicks on a `tel:` link, which is exactly the case a cancelled
/// in-flight request would lose. It also sends `text/plain`, so there is no
/// CORS preflight — PostHog accepts the JSON body regardless.
#[cfg(target_arch = "wasm32")]
fn send(body: &str) {
	const CAPTURE: &str = "https://us.i.posthog.com/capture/";
	let Some(navigator) = web_sys::window().map(|w| w.navigator()) else {
		return;
	};
	// The bool result is "was it queued"; a refusal must never surface to a
	// visitor whose actual goal is a phone call.
	let _ = navigator.send_beacon_with_opt_str(CAPTURE, Some(body));
}

#[cfg(not(target_arch = "wasm32"))]
fn send(_body: &str) {}

/// A per-browser anonymous id, persisted so a returning visitor is one person
/// rather than two. Not derived from anything about them; if `localStorage` is
/// unavailable the session simply counts as new.
#[cfg(target_arch = "wasm32")]
fn distinct_id() -> String {
	const KEY: &str = "aquafix_did";
	let Some(store) = web_sys::window().and_then(|w| w.local_storage().ok().flatten()) else {
		return "anon".to_string();
	};
	if let Ok(Some(existing)) = store.get_item(KEY) {
		return existing;
	}
	let fresh = format!("{:016x}", (js_sys::Math::random() * f64::from(u32::MAX)) as u64 ^ (js_sys::Date::now() as u64));
	let _ = store.set_item(KEY, &fresh);
	fresh
}

#[cfg(not(target_arch = "wasm32"))]
fn distinct_id() -> String {
	"ssr".to_string()
}
