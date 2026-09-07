//! Per-route `<head>`, `/robots.txt` and `/sitemap.xml`.
//!
//! Every field is read from the route's [`Page`] in the route's [`Lang`];
//! nothing here restates a string `content` already owns. Dioxus SSRs
//! `document::*` into `<head>`, so a crawler gets all of it on the first byte
//! with no hydration.
//!
//! Both language versions of a page are their own indexable URL, each
//! self-canonical and each naming the whole cluster in `hreflang`. `x-default`
//! is the English URL, which is also the one an unprefixed entry serves.

use dioxus::prelude::*;

use crate::content::{LANGS, Lang, Page, SITE};

/// The head for one route. `noindex` for the status pages, which are not in
/// `Text.pages` and must not be indexed or appear in the sitemap.
#[component]
pub fn Head(page: ReadSignal<&'static Page>, lang: Lang) -> Element {
	let page = page();
	let title = if page.path == "/" {
		format!("{} — {}", SITE.name, page.title)
	} else {
		format!("{} · {}", page.title, SITE.name)
	};
	let canonical = SITE.url(&lang.href(page.path));
	let og_image = format!("{}/og{}.png", SITE.origin(), if page.path == "/" { "/home" } else { page.path });
	rsx! {
		document::Title { "{title}" }
		document::Meta { name: "description", content: page.description }
		document::Meta { name: "robots", content: "index,follow" }
		document::Link { rel: "canonical", href: "{canonical}" }
		for other in LANGS.iter().copied() {
			document::Link { rel: "alternate", hreflang: other.tag(), href: SITE.url(&other.href(page.path)) }
		}
		XDefault { href: SITE.url(page.path) }
		document::Meta { property: "og:type", content: "website" }
		document::Meta { property: "og:site_name", content: SITE.name }
		document::Meta { property: "og:title", content: "{title}" }
		document::Meta { property: "og:description", content: page.description }
		document::Meta { property: "og:url", content: "{canonical}" }
		document::Meta { property: "og:image", content: "{og_image}" }
		document::Meta { property: "og:locale", content: lang.og_locale() }
		for other in LANGS.iter().copied().filter(|l| *l != lang) {
			document::Meta { property: "og:locale:alternate", content: other.og_locale() }
		}
		document::Meta { name: "twitter:card", content: "summary_large_image" }
		crate::ld::JsonLd { page: page, lang }
	}
}

/// The `x-default` alternate, which is the English URL.
///
/// `document::Link` deduplicates by `href|rel`, and this shares both with the
/// `en` alternate, so it would be silently dropped. Writing it through the head
/// API one level down is the only difference; the `create_head_component` gate
/// is the same one `Link` honours so hydration does not insert it twice.
#[component]
fn XDefault(href: String) -> Element {
	use_hook(|| {
		let document = dioxus::document::document();
		if document.create_head_component() {
			document.create_link(document::LinkProps::builder().rel("alternate".to_string()).hreflang("x-default".to_string()).href(href).build());
		}
	});
	VNode::empty()
}

/// The head for a page that must never be indexed.
#[component]
pub fn NoIndexHead(title: &'static str) -> Element {
	rsx! {
		document::Title { "{title} · {SITE.name}" }
		document::Meta { name: "robots", content: "noindex,nofollow" }
	}
}

/// Allow everything, and name the AI crawlers explicitly — several treat a bare
/// wildcard as ambiguous and an explicit `Allow` as consent.
pub fn robots_txt() -> String {
	format!(
		"User-agent: *\nAllow: /\n\n\
		 User-agent: GPTBot\nUser-agent: ClaudeBot\nUser-agent: PerplexityBot\nUser-agent: Google-Extended\nAllow: /\n\n\
		 Sitemap: {}/sitemap.xml\n",
		SITE.origin()
	)
}

/// One `<url>` per (page × language), each carrying the full alternate set.
///
/// No `<lastmod>`: a build timestamp that moves on every deploy without the
/// content changing is a lie, and there is nothing better to put there.
pub fn sitemap_xml() -> String {
	let urls: String = Lang::En
		.text()
		.pages
		.iter()
		.flat_map(|p| LANGS.iter().map(move |lang| (p.path, *lang)))
		.map(|(path, lang)| {
			let priority = if path == "/" { "1.0" } else { "0.8" };
			let alternates: String = LANGS
				.iter()
				.map(|other| format!("    <xhtml:link rel=\"alternate\" hreflang=\"{}\" href=\"{}\"/>\n", other.tag(), SITE.url(&other.href(path))))
				.collect();
			format!(
				"  <url>\n    <loc>{}</loc>\n{alternates}    <xhtml:link rel=\"alternate\" hreflang=\"x-default\" href=\"{}\"/>\n    <priority>{priority}</priority>\n  </url>\n",
				SITE.url(&lang.href(path)),
				SITE.url(path)
			)
		})
		.collect();
	format!(
		"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\" xmlns:xhtml=\"http://www.w3.org/1999/xhtml\">\n{urls}</urlset>\n"
	)
}
