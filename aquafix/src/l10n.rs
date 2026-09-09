//! Which language a request gets, decided before the router sees it.
//!
//! ```text
//! ?lang=<l>                           → cookie (1y), 303 to the clean path
//! /en/...                             → 301 to the unprefixed equivalent
//! unprefixed, no cookie, prefers fr   → 302 to /fr/...
//! any page response                   → Vary: Accept-Language
//! ```
//!
//! Only the page paths and their `/fr` twins enter this; `/quote`, `/health`,
//! `/robots.txt`, `/sitemap.xml`, `/assets/*` and the server-fn routes pass
//! straight through.
//!
//! The auto-redirect is a **302**, never a 301: the choice is per-visitor and
//! must not be cached as permanent. Googlebot crawls with `Accept-Language: en`
//! or none, so it sees English at `/` and reaches French through `hreflang` —
//! the negotiation never fires for it.

use dioxus::server::axum::{
	extract::Request,
	http::{HeaderValue, StatusCode, Uri, header},
	middleware::Next,
	response::{IntoResponse, Response},
};

use crate::content::{LANGS, Lang};

const COOKIE: &str = "lang";
/// The path components a page URL can have, without a language prefix. The
/// route table's seven arms; anything else is not ours to negotiate.
const PAGES: &[&str] = &["/", "/prices", "/guarantee", "/about", "/thanks", "/403", "/500"];

pub async fn negotiate_language(request: Request, next: Next) -> Response {
	let uri = request.uri().clone();
	let Some((path, lang)) = split(uri.path()) else {
		return next.run(request).await;
	};

	if let Some(chosen) = query_lang(&uri) {
		// The visitor asked, so record it and get the query back out of the URL —
		// a shared or bookmarked link should not keep re-asserting a language.
		return (
			StatusCode::SEE_OTHER,
			[
				(header::LOCATION, chosen.href(path)),
				(header::SET_COOKIE, format!("{COOKIE}={chosen}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly; Secure")),
			],
		)
			.into_response();
	}

	// `/en/prices` is a synonym for `/prices`, and only one of them is canonical.
	if uri.path().starts_with("/en/") || uri.path() == "/en" {
		return (StatusCode::MOVED_PERMANENTLY, [(header::LOCATION, path.to_string())]).into_response();
	}

	if lang == Lang::En && cookie_lang(&request).is_none() {
		let preferred = negotiate(request.headers().get(header::ACCEPT_LANGUAGE).and_then(|v| v.to_str().ok()).unwrap_or_default());
		if preferred != Lang::En {
			return (StatusCode::FOUND, [(header::LOCATION, preferred.href(path)), (header::VARY, "Accept-Language".to_string())]).into_response();
		}
	}

	let mut response = next.run(request).await;
	response.headers_mut().append(header::VARY, HeaderValue::from_static("Accept-Language"));
	response
}

/// The highest-`q` tag whose base subtag we serve. `en` when nothing matches,
/// which is also what a header-less crawler gets.
pub fn negotiate(header: &str) -> Lang {
	let mut ranked: Vec<(f32, &str)> = header
		.split(',')
		.filter_map(|entry| {
			let mut parts = entry.split(';');
			let tag = parts.next()?.trim();
			let q = parts.find_map(|p| p.trim().strip_prefix("q=")).map_or(1.0, |v| v.parse().unwrap_or(0.0));
			(q > 0.0 && !tag.is_empty()).then_some((q, tag))
		})
		.collect();
	ranked.sort_by(|a, b| b.0.total_cmp(&a.0));
	ranked
		.iter()
		.find_map(|(_, tag)| {
			let base = tag.split('-').next().unwrap_or(tag);
			LANGS.iter().copied().find(|l| l.tag() == base)
		})
		.unwrap_or_default()
}
/// `/fr/prices` → `("/prices", Fr)`, `/prices` → `("/prices", En)`, and `None`
/// for anything that is not one of our pages. `/en/...` resolves too — it is
/// not a route, but it has to be caught here to be redirected.
fn split(path: &str) -> Option<(&'static str, Lang)> {
	for (prefix, lang) in LANGS.iter().copied().map(|l| (l.prefix(), l)).chain([("/en", Lang::En)]) {
		let Some(rest) = path.strip_prefix(prefix) else { continue };
		let rest = match rest {
			"" | "/" => "/",
			r if r.starts_with('/') => r.trim_end_matches('/'),
			_ => continue,
		};
		if let Some(page) = PAGES.iter().find(|p| **p == rest) {
			return Some((page, lang));
		}
	}
	None
}

fn query_lang(uri: &Uri) -> Option<Lang> {
	let query = uri.query()?;
	let value = query.split('&').find_map(|pair| pair.strip_prefix("lang="))?;
	LANGS.iter().copied().find(|l| l.tag() == value)
}

fn cookie_lang(request: &Request) -> Option<Lang> {
	let jar = request.headers().get(header::COOKIE)?.to_str().ok()?;
	let value = jar.split(';').map(str::trim).find_map(|c| c.strip_prefix("lang="))?;
	LANGS.iter().copied().find(|l| l.tag() == value)
}

#[cfg(test)]
mod tests {
	use super::{negotiate, split};
	use crate::content::Lang;

	#[test]
	fn quality_values_order_the_choice() {
		assert_eq!(negotiate("fr-CH,fr;q=0.9,en;q=0.8"), Lang::Fr);
		assert_eq!(negotiate("en-US,en;q=0.9,fr;q=0.5"), Lang::En);
		assert_eq!(negotiate(""), Lang::En);
		assert_eq!(negotiate("fr;q=0"), Lang::En);
		assert_eq!(negotiate("de,fr;q=0.7"), Lang::Fr);
	}

	#[test]
	fn only_page_paths_are_negotiated() {
		assert_eq!(split("/prices"), Some(("/prices", Lang::En)));
		assert_eq!(split("/fr/prices"), Some(("/prices", Lang::Fr)));
		assert_eq!(split("/fr"), Some(("/", Lang::Fr)));
		assert_eq!(split("/en/prices"), Some(("/prices", Lang::En)));
		assert_eq!(split("/quote"), None);
		assert_eq!(split("/sitemap.xml"), None);
		assert_eq!(split("/fr/nonsense"), None);
	}
}
