import { ldCompact, localBusiness, type JsonLdNode } from "@evinvest/marketing";
import { PRICE_LIST, type Copy } from "@/entities/content";
import {
  brandOrigin,
  contactOf,
  freshRating,
  placeOrigin,
  servedLocalities,
  storefrontOf,
  type Place,
  type PlaceView,
} from "@/entities/place";
import { PAGES, site, type PageKey } from "@/shared/config/site";
import { i18n } from "@/shared/config/i18n";

/**
 * schema.org, derived from the copy and the point and never authored. One
 * `@graph` per page with shared `@id`s, so Google collapses the entities
 * instead of reading each as separate. The price table and the FAQ are the
 * two real rich-result opportunities, and both fall out of the typed data: a
 * price row renders a cell *and* emits its `Offer` from one integer.
 *
 * No `aggregateRating` from anything the repo holds. A rating appears only when
 * the live source mirrored it from Google within the API's 30-day window.
 */
export const organizationId = (): string => `${brandOrigin()}/#organization`;
// Language-free: the French and the English page describe one business.
const businessId = (point: PlaceView): string => `${placeOrigin(point.place.slug)}/#business`;
const websiteId = (point: PlaceView): string => `${placeOrigin(point.place.slug)}/#website`;

function days(place: Place): JsonLdNode[] | undefined {
  return place.hours?.map(h => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: h.days,
    opens: h.opens,
    closes: h.closes,
  }));
}

/** Named communes as `Place`s, a radius as a `GeoCircle`. */
function areaServed(place: Place): JsonLdNode[] {
  const named: JsonLdNode[] = servedLocalities(place).map(name => ({ "@type": "Place", name }));
  const circles: JsonLdNode[] = (place.serviceArea ?? []).flatMap(area =>
    area.kind === "radius"
      ? [
          {
            "@type": "GeoCircle",
            geoMidpoint: { "@type": "GeoCoordinates", latitude: area.center.lat, longitude: area.center.lng },
            geoRadius: area.km * 1000,
          },
        ]
      : [],
  );
  return [...named, ...circles];
}

/**
 * The business behind one point. A storefront carries its address, pin and
 * photo; a service-area business has none of the three in its type, so its
 * node says where it goes (`areaServed`) and nothing about where it is.
 */
export function businessNode(point: PlaceView, now: Date): JsonLdNode {
  const { place } = point;
  const front = storefrontOf(place);
  const rating = freshRating(place, now);
  return localBusiness(
    {
      id: businessId(point),
      type: site.brand.businessType,
      name: place.gbpName,
      url: point.url(""),
      telephone: contactOf(place).phone,
      email: site.brand.email,
      image: front?.storefrontPhoto ?? undefined,
      address: front
        ? {
            streetAddress: front.address.street,
            postalCode: front.address.postalCode,
            addressLocality: front.address.locality,
            addressRegion: front.address.region,
            addressCountry: front.address.country,
          }
        : undefined,
      geo: front?.geo ?? undefined,
      parentOrganization: { "@id": organizationId() },
    },
    ldCompact({
      priceRange: site.brand.priceRange,
      areaServed: areaServed(place),
      openingHoursSpecification: days(place),
      aggregateRating: rating
        ? { "@type": "AggregateRating", ratingValue: rating.value, reviewCount: rating.count, bestRating: 5 }
        : undefined,
    }),
  );
}

export function organizationNode(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": organizationId(),
    name: site.brand.name,
    legalName: site.brand.legalName,
    url: brandOrigin(),
    email: site.brand.email,
  };
}

/** The town an offer is priced for: a storefront's own, or the first commune served. */
function cityOf(place: Place): JsonLdNode | undefined {
  const name = storefrontOf(place)?.address.locality ?? servedLocalities(place)[0];
  return name === undefined ? undefined : { "@type": "City", name };
}

/** One `Service` + `Offer` per price row: the same integer as the table cell. */
export function offerNodes(point: PlaceView, copy: Copy): JsonLdNode[] {
  return PRICE_LIST.map(row => ({
    "@type": "Service",
    name: copy.t.prices[row.id].job,
    serviceType: copy.t.prices[row.id].job,
    provider: { "@id": businessId(point) },
    areaServed: cityOf(point.place),
    offers: {
      "@type": "Offer",
      price: row.fromEur,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "PriceSpecification",
        minPrice: row.fromEur,
        priceCurrency: "EUR",
        valueAddedTaxIncluded: true,
      },
    },
  }));
}

function faqNode(copy: Copy): JsonLdNode {
  return {
    "@type": "FAQPage",
    mainEntity: copy.t.faqs.map(faq => ({
      "@type": "Question",
      name: faq.q(copy.f),
      acceptedAnswer: { "@type": "Answer", text: faq.a(copy.f) },
    })),
  };
}

/** Home → page. The chain is the route, so a new page cannot forget it. */
function breadcrumbs(point: PlaceView, copy: Copy, page: PageKey): JsonLdNode {
  const items: JsonLdNode[] = [
    { "@type": "ListItem", position: 1, name: `${site.brand.name} ${copy.f.place}`, item: point.url(PAGES.home) },
  ];
  if (page !== "home") {
    items.push({ "@type": "ListItem", position: 2, name: copy.t.pages[page].title(copy.f), item: point.url(PAGES[page]) });
  }
  return { "@type": "BreadcrumbList", itemListElement: items };
}

/** The `@graph` for one of a point's pages in one language. */
export function locationGraph(point: PlaceView, copy: Copy, page: PageKey, now: Date): JsonLdNode {
  const url = point.url(PAGES[page]);
  const nodes: JsonLdNode[] = [
    organizationNode(),
    businessNode(point, now),
    { "@type": "WebSite", "@id": websiteId(point), url: placeOrigin(point.place.slug), name: `${site.brand.name} ${copy.f.place}` },
    {
      "@type": "WebPage",
      "@id": `${url}#page`,
      url,
      name: copy.t.pages[page].title(copy.f),
      description: copy.t.pages[page].description(copy.f),
      inLanguage: i18n.hreflangOf(copy.locale),
      isPartOf: { "@id": websiteId(point) },
      about: { "@id": businessId(point) },
    },
    breadcrumbs(point, copy, page),
  ];
  // The price list is on the home page and /prices, the FAQ only on /prices.
  // Emitting either where it is not rendered is a structured-data mismatch.
  if (page === "home" || page === "prices") nodes.push(...offerNodes(point, copy));
  if (page === "prices") nodes.push(faqNode(copy));
  return { "@context": "https://schema.org", "@graph": nodes };
}
