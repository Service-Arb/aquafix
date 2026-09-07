//! The invariants that keep `content.rs` a single source.
//!
//! `SITE` owns the mutable facts — the phone number, the licence, the insurance
//! figure — but the design's prose quotes several of them mid-sentence, and
//! rewriting Figma copy through `format!` would make it unreviewable against
//! the frame it came from. So the prose stays verbatim and these tests fail the
//! build if a `SITE` field is changed without the prose following it.
//!
//! This is the whole reason the placeholder phone number and licence can sit in
//! the tree safely until launch: replacing them cannot half-land.
//!
//! Each runs over every language, so a French translation that drifts fails the
//! same way an English edit would.

use aquafix::content::*;

#[test]
fn prose_that_names_the_phone_reads_it_from_site() {
	for lang in LANGS.iter().copied() {
		let t = lang.text();
		for text in [t.quote_reassurance(), t.guarantee_cta_aside(), t.closing_aside(), t.call_label()] {
			assert!(text.contains(SITE.phone), "{lang}: prose names a phone number that is not SITE.phone: {text:?}");
		}
	}
}

#[test]
fn no_content_string_hardcodes_a_stale_licence_or_insurance() {
	for lang in LANGS.iter().copied() {
		let t = lang.text();
		// The licence appears in the hero eyebrow, the proof bar, the footer facts
		// and one FAQ answer. All four must agree with SITE.
		let quoting: Vec<&str> = std::iter::once(t.hero_eyebrow)
			.chain(t.proof.iter().map(|p| p.value))
			.chain(t.footer_facts.iter().copied())
			.chain(t.faqs.iter().map(|f| f.a))
			.filter(|s| s.contains("#PL-") || s.contains("PL-4"))
			.collect();
		assert!(!quoting.is_empty(), "{lang}: nothing quotes the licence — did the copy change?");
		for text in quoting {
			let bare = SITE.licence.trim_start_matches('#');
			assert!(text.contains(bare), "{lang}: quotes a licence that is not SITE.licence ({}): {text:?}", SITE.licence);
		}
	}
}

#[test]
fn tel_href_is_dialable() {
	assert_eq!(SITE.tel_href(), "tel:+15035550148");
}

#[test]
fn every_page_is_reachable_by_path() {
	for lang in LANGS.iter().copied() {
		for p in lang.text().pages {
			assert_eq!(lang.page(p.path).path, p.path);
		}
	}
}

/// The one check the whole translation rests on. A `PriceRow` renders a table
/// cell in one language and emits its schema.org `Offer` in both, so a French
/// price that drifts from its English twin puts one number on the page and
/// another in the structured data — and nothing else in the suite would notice.
#[test]
fn the_language_free_half_of_every_record_is_identical() {
	let en = Lang::En.text();
	for lang in LANGS.iter().copied().filter(|l| *l != Lang::En) {
		let t = lang.text();
		assert_eq!(
			t.pages.iter().map(|p| p.path).collect::<Vec<_>>(),
			en.pages.iter().map(|p| p.path).collect::<Vec<_>>(),
			"{lang}: page paths"
		);
		assert_eq!(
			t.prices.iter().map(|r| r.from_usd).collect::<Vec<_>>(),
			en.prices.iter().map(|r| r.from_usd).collect::<Vec<_>>(),
			"{lang}: price rows"
		);
		assert_eq!(
			t.services.iter().map(|s| s.from_usd).collect::<Vec<_>>(),
			en.services.iter().map(|s| s.from_usd).collect::<Vec<_>>(),
			"{lang}: service prices"
		);
		assert_eq!(
			t.jobs.iter().map(|(v, _)| *v).collect::<Vec<_>>(),
			en.jobs.iter().map(|(v, _)| *v).collect::<Vec<_>>(),
			"{lang}: job slugs"
		);
		assert_eq!(
			t.crew.iter().map(|c| (c.initials, c.name)).collect::<Vec<_>>(),
			en.crew.iter().map(|c| (c.initials, c.name)).collect::<Vec<_>>(),
			"{lang}: crew identity"
		);
		assert_eq!(
			t.reviews.iter().map(|r| r.stars).collect::<Vec<_>>(),
			en.reviews.iter().map(|r| r.stars).collect::<Vec<_>>(),
			"{lang}: review stars"
		);
		assert_eq!(
			t.footer_services.iter().map(|(_, h)| *h).collect::<Vec<_>>(),
			en.footer_services.iter().map(|(_, h)| *h).collect::<Vec<_>>(),
			"{lang}: footer service hrefs"
		);
		assert_eq!(
			t.nav.iter().map(|(_, h)| *h).collect::<Vec<_>>(),
			en.nav.iter().map(|(_, h)| *h).collect::<Vec<_>>(),
			"{lang}: nav hrefs"
		);
	}
}

/// `/prices` → `/fr/prices`, and a fragment is not a path.
#[test]
fn the_prefix_lands_before_the_path_and_never_before_a_fragment() {
	assert_eq!(Lang::En.href("/prices"), "/prices");
	assert_eq!(Lang::Fr.href("/prices"), "/fr/prices");
	assert_eq!(Lang::Fr.href("/"), "/fr");
	assert_eq!(Lang::Fr.href("/#quote"), "/fr#quote");
	assert_eq!(Lang::Fr.href("#quote"), "#quote");
}

/// The table renders `from_display()` and `ld` emits `from_usd`; a formatter
/// that disagrees with its own input would put one price on the page and
/// another in the structured data.
#[test]
fn prices_format_with_separators() {
	assert_eq!(usd(149), "$149");
	assert_eq!(usd(1290), "$1,290");
	assert_eq!(usd(4800), "$4,800");
	for row in Lang::En.text().prices {
		assert!(row.from_display().contains(&row.from_usd.to_string()[..1]));
	}
}

/// A lead with no reachable number is not a lead; everything else is accepted.
#[test]
fn validate_rejects_only_unreachable_leads() {
	use aquafix::quote::Lead;
	let ok = Lead {
		job: "blocked_drain".into(),
		zip: "97210".into(),
		mobile: "(503) 555-0148".into(),
	};
	assert!(ok.validate().is_ok());

	let short = Lead {
		mobile: "503555".into(),
		..ok.clone()
	};
	assert!(short.validate().is_err());

	let no_zip = Lead { zip: "  ".into(), ..ok.clone() };
	assert!(no_zip.validate().is_err());
}

/// Status pages must not reach the sitemap, and both language versions of every
/// real page must.
#[test]
fn sitemap_lists_exactly_the_indexable_pages() {
	let xml = aquafix::seo::sitemap_xml();
	for lang in LANGS.iter().copied() {
		for p in lang.text().pages {
			assert!(
				xml.contains(&format!("<loc>{}</loc>", SITE.url(&lang.href(p.path)))),
				"sitemap is missing {} ({lang})",
				p.path
			);
		}
	}
	for status in ["/404", "/403", "/500", "/thanks"] {
		assert!(!xml.contains(&format!("{}<", SITE.url(status))), "sitemap leaks the status page {status}");
	}
	assert_eq!(xml.matches("<loc>").count(), Lang::En.text().pages.len() * LANGS.len());
}
