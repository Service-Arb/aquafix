//! Per-route `<head>`, `/robots.txt` and `/sitemap.xml`.
//!
//! Every field is read from the route's [`Page`]; nothing here restates a
//! string `content` already owns. Dioxus SSRs `document::*` into `<head>`, so a
//! crawler gets all of it on the first byte with no hydration.

use dioxus::prelude::*;

use crate::content::{PAGES, Page, SITE};

/// The head for one route. `noindex` for the status pages, which are not in
/// `PAGES` and must not be indexed or appear in the sitemap.
#[component]
pub fn Head(page: ReadSignal<&'static Page>) -> Element {
	let page = page();
	let title = if page.path == "/" {
		format!("{} — {}", SITE.name, page.title)
	} else {
		format!("{} · {}", page.title, SITE.name)
	};
	let canonical = SITE.url(page.path);
	let og_image = format!("{}/og{}.png", SITE.origin(), if page.path == "/" { "/home" } else { page.path });
	rsx! {
		document::Title { "{title}" }
		document::Meta { name: "description", content: page.description }
		document::Meta { name: "robots", content: "index,follow" }
		document::Link { rel: "canonical", href: "{canonical}" }
		document::Meta { property: "og:type", content: "website" }
		document::Meta { property: "og:site_name", content: SITE.name }
		document::Meta { property: "og:title", content: "{title}" }
		document::Meta { property: "og:description", content: page.description }
		document::Meta { property: "og:url", content: "{canonical}" }
		document::Meta { property: "og:image", content: "{og_image}" }
		document::Meta { name: "twitter:card", content: "summary_large_image" }
		crate::ld::JsonLd { page: page }
	}
}

/// The head for a page that must never be indexed.
#[component]
pub fn NoIndexHead(title: String) -> Element {
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

/// No `<lastmod>`: a build timestamp that moves on every deploy without the
/// content changing is a lie, and there is nothing better to put there.
pub fn sitemap_xml() -> String {
	let urls: String = PAGES
		.iter()
		.map(|p| {
			let priority = if p.path == "/" { "1.0" } else { "0.8" };
			format!("  <url><loc>{}</loc><priority>{priority}</priority></url>\n", SITE.url(p.path))
		})
		.collect();
	format!("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n{urls}</urlset>\n")
}
