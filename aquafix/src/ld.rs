//! schema.org, derived from `content` and never authored.
//!
//! One `@graph` per page with shared `@id`s, so Google collapses the entities
//! instead of reading each as a separate thing. The price table and the FAQ are
//! the two real rich-result opportunities and both fall out of the typed data
//! for free — a `PriceRow` renders a row *and* emits its `Offer` from one value.

use dioxus::prelude::*;
use serde_json::{Value, json};

use crate::content::{AREAS, CREW, FAQS, PRICES, Page, RATING, SITE};

/// The `@graph` for one route.
pub fn graph(page: &Page) -> Value {
	let mut nodes = vec![
		business(),
		json!({
			"@type": "WebSite",
			"@id": website_id(),
			"url": SITE.origin(),
			"name": SITE.name,
			"publisher": {"@id": business_id()},
		}),
		json!({
			"@type": "WebPage",
			"@id": format!("{}#page", SITE.url(page.path)),
			"url": SITE.url(page.path),
			"name": page.title,
			"description": page.description,
			"isPartOf": {"@id": website_id()},
			"about": {"@id": business_id()},
		}),
		breadcrumbs(page),
	];
	// The price list is on both the landing page and /prices; the FAQ is only on
	// /prices. Emitting either where it is not rendered is a structured-data
	// mismatch Google penalises.
	if matches!(page.path, "/" | "/prices") {
		nodes.extend(offers());
	}
	if page.path == "/prices" {
		nodes.push(faq_page());
	}
	json!({"@context": "https://schema.org", "@graph": nodes})
}
#[component]
pub fn JsonLd(page: ReadSignal<&'static Page>) -> Element {
	let body = graph(page()).to_string();
	rsx! {
		document::Script { r#type: "application/ld+json", {body} }
	}
}
fn business_id() -> String {
	format!("{}/#business", SITE.origin())
}

fn website_id() -> String {
	format!("{}/#website", SITE.origin())
}

fn business() -> Value {
	let (rating, count) = RATING;
	json!({
		"@type": ["Plumber", "LocalBusiness"],
		"@id": business_id(),
		"name": SITE.legal_name,
		"url": SITE.origin(),
		"telephone": SITE.phone,
		"email": SITE.email(),
		"priceRange": SITE.price_range,
		"foundingDate": SITE.founded.to_string(),
		"address": {
			"@type": "PostalAddress",
			"streetAddress": SITE.street,
			"addressLocality": SITE.locality,
			"addressRegion": SITE.region,
			"postalCode": SITE.postal_code,
			"addressCountry": "US",
		},
		"areaServed": AREAS.iter().map(|a| json!({"@type": "Place", "name": a})).collect::<Vec<_>>(),
		// The phone is answered 24/7; bookings are 7am–9pm. The wider window is
		// the one a customer in an emergency needs to see.
		"openingHoursSpecification": [{
			"@type": "OpeningHoursSpecification",
			"dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
			"opens": "00:00",
			"closes": "23:59",
		}],
		"aggregateRating": {
			"@type": "AggregateRating",
			"ratingValue": rating,
			"reviewCount": count,
			"bestRating": 5,
		},
		"employee": CREW.iter().map(|c| json!({
			"@type": "Person",
			"@id": format!("{}/about#crew-{}", SITE.origin(), c.initials),
			"name": c.name,
			"jobTitle": c.role,
		})).collect::<Vec<_>>(),
	})
}

fn offers() -> Vec<Value> {
	PRICES
		.iter()
		.map(|row| {
			json!({
				"@type": "Service",
				"name": row.job,
				"serviceType": row.job,
				"provider": {"@id": business_id()},
				"areaServed": {"@type": "City", "name": SITE.locality},
				"offers": {
					"@type": "Offer",
					"price": row.from_usd,
					"priceCurrency": "USD",
					"availability": "https://schema.org/InStock",
					"priceSpecification": {
						"@type": "PriceSpecification",
						"minPrice": row.from_usd,
						"priceCurrency": "USD",
						"valueAddedTaxIncluded": false,
					},
				},
			})
		})
		.collect()
}

fn faq_page() -> Value {
	json!({
		"@type": "FAQPage",
		"mainEntity": FAQS.iter().map(|f| json!({
			"@type": "Question",
			"name": f.q,
			"acceptedAnswer": {"@type": "Answer", "text": f.a},
		})).collect::<Vec<_>>(),
	})
}

/// `/` → just Home. `/prices` → Home › Prices. The chain is the path, so a new
/// route cannot forget its breadcrumb.
fn breadcrumbs(page: &Page) -> Value {
	let mut items = vec![json!({
		"@type": "ListItem",
		"position": 1,
		"name": SITE.name,
		"item": SITE.origin(),
	})];
	if page.path != "/" {
		items.push(json!({
			"@type": "ListItem",
			"position": 2,
			"name": page.title,
			"item": SITE.url(page.path),
		}));
	}
	json!({"@type": "BreadcrumbList", "itemListElement": items})
}

/// Every route in `PAGES` builds a graph. Cheap insurance against a `json!`
/// that only panics on the one page nobody opened before deploying.
#[cfg(test)]
mod tests {
	#[test]
	fn every_page_has_a_graph() {
		for page in crate::content::PAGES {
			let graph = super::graph(page);
			assert!(graph["@graph"].as_array().is_some_and(|n| n.len() >= 4), "{} has a thin graph", page.path);
		}
	}
}
