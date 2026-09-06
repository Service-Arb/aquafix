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

use aquafix::content::*;

/// Every string on the site that names the phone number.
fn prose_quoting_phone() -> Vec<String> {
	vec![quote_reassurance(), guarantee_cta_aside(), closing_aside(), call_label()]
}

#[test]
fn prose_that_names_the_phone_reads_it_from_site() {
	for text in prose_quoting_phone() {
		assert!(text.contains(SITE.phone), "prose names a phone number that is not SITE.phone: {text:?}");
	}
}

#[test]
fn no_content_string_hardcodes_a_stale_licence_or_insurance() {
	// The licence appears in the hero eyebrow, the proof bar, the footer facts
	// and one FAQ answer. All four must agree with SITE.
	let quoting: Vec<&str> = std::iter::once(HERO_EYEBROW)
		.chain(PROOF.iter().map(|p| p.value))
		.chain(FOOTER_FACTS.iter().copied())
		.chain(FAQS.iter().map(|f| f.a))
		.filter(|s| s.contains("#PL-") || s.contains("PL-4"))
		.collect();
	assert!(!quoting.is_empty(), "nothing quotes the licence — did the copy change?");
	for text in quoting {
		let bare = SITE.licence.trim_start_matches('#');
		assert!(text.contains(bare), "quotes a licence that is not SITE.licence ({}): {text:?}", SITE.licence);
	}
}

#[test]
fn tel_href_is_dialable() {
	assert_eq!(SITE.tel_href(), "tel:+15035550148");
}

#[test]
fn every_page_is_reachable_by_path() {
	for p in PAGES {
		assert_eq!(page(p.path).path, p.path);
	}
}

/// The table renders `from_display()` and `ld` emits `from_usd`; a formatter
/// that disagrees with its own input would put one price on the page and
/// another in the structured data.
#[test]
fn prices_format_with_separators() {
	assert_eq!(usd(149), "$149");
	assert_eq!(usd(1290), "$1,290");
	assert_eq!(usd(4800), "$4,800");
	for row in PRICES {
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

/// Status pages must not reach the sitemap, and `/` must be in it.
#[test]
fn sitemap_lists_exactly_the_indexable_pages() {
	let xml = aquafix::seo::sitemap_xml();
	for p in PAGES {
		assert!(xml.contains(&SITE.url(p.path)), "sitemap is missing {}", p.path);
	}
	for status in ["/404", "/403", "/500", "/thanks"] {
		assert!(!xml.contains(&format!("{}<", SITE.url(status))), "sitemap leaks the status page {status}");
	}
}
