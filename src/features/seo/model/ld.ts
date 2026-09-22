import { ldCompact, localBusiness, type JsonLdNode } from "@evinvest/marketing";
import { PRICE_LIST, type Copy } from "@/entities/content";
import { brandOrigin, freshRating, locationOrigin, type Location, type Point } from "@/entities/location";
import { BRAND } from "@/shared/config/brand";
import { i18n } from "@/shared/config/i18n";
import { PAGES, type PageKey } from "@/shared/config/routes";

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
const businessId = (point: Point): string => `${locationOrigin(point.location.slug)}/#business`;
const websiteId = (point: Point): string => `${locationOrigin(point.location.slug)}/#website`;

function days(location: Location): JsonLdNode[] | undefined {
  return location.hours?.map(h => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: h.days,
    opens: h.opens,
    closes: h.closes,
  }));
}

export function businessNode(point: Point, now: Date): JsonLdNode {
  const { location } = point;
  const rating = freshRating(location, now);
  return localBusiness(
    {
      id: businessId(point),
      type: "Plumber",
      name: location.gbpName,
      url: point.url(""),
      telephone: location.phone,
      email: BRAND.email,
      image: location.storefrontPhoto ?? undefined,
      address: {
        streetAddress: location.address.street,
        postalCode: location.address.postalCode,
        addressLocality: location.address.locality,
        addressRegion: location.address.region,
        addressCountry: location.address.country,
      },
      geo: location.geo ?? undefined,
      parentOrganization: { "@id": organizationId() },
    },
    ldCompact({
      priceRange: BRAND.priceRange,
      areaServed: (location.serviceArea ?? [location.address.locality]).map(name => ({ "@type": "Place", name })),
      openingHoursSpecification: days(location),
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
    name: BRAND.name,
    legalName: BRAND.legalName,
    url: brandOrigin(),
    email: BRAND.email,
  };
}

/** One `Service` + `Offer` per price row: the same integer as the table cell. */
export function offerNodes(point: Point, copy: Copy): JsonLdNode[] {
  return PRICE_LIST.map(row => ({
    "@type": "Service",
    name: copy.t.prices[row.id].job,
    serviceType: copy.t.prices[row.id].job,
    provider: { "@id": businessId(point) },
    areaServed: { "@type": "City", name: point.location.address.locality },
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
function breadcrumbs(point: Point, copy: Copy, page: PageKey): JsonLdNode {
  const items: JsonLdNode[] = [
    { "@type": "ListItem", position: 1, name: `${BRAND.name} ${copy.f.place}`, item: point.url(PAGES.home) },
  ];
  if (page !== "home") {
    items.push({ "@type": "ListItem", position: 2, name: copy.t.pages[page].title(copy.f), item: point.url(PAGES[page]) });
  }
  return { "@type": "BreadcrumbList", itemListElement: items };
}

/** The `@graph` for one of a point's pages in one language. */
export function locationGraph(point: Point, copy: Copy, page: PageKey, now: Date): JsonLdNode {
  const url = point.url(PAGES[page]);
  const nodes: JsonLdNode[] = [
    organizationNode(),
    businessNode(point, now),
    { "@type": "WebSite", "@id": websiteId(point), url: locationOrigin(point.location.slug), name: `${BRAND.name} ${copy.f.place}` },
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
