import { placeGraph, type JsonLdNode, type OfferInput, type PageGraphCopy } from "@evinvest/kitstart";
import { faqItems, PRICE_LIST, type Copy } from "@/entities/content";
import type { PlaceView } from "@/entities/place";
import { site, type PageKey } from "@/shared/config/site";

/**
 * schema.org, derived from the copy and the point and never authored — the
 * graph itself is kitstart's `placeGraph`; this module says which of
 * Aquafix's words it quotes. The price table and the FAQ are the two real
 * rich-result opportunities, and both fall out of the typed data: a price row
 * renders a cell *and* emits its `Offer` from one integer.
 */

/** One `Service` + `Offer` per price row: the same integer as the table cell. */
function offers(copy: Copy): OfferInput[] {
  return PRICE_LIST.map(row => ({ name: copy.t.prices[row.id].job, price: row.fromEur }));
}

/**
 * The words one page's graph quotes. The price list is on the home page and
 * /prices, the FAQ only on /prices: emitting either where it is not rendered
 * is a structured-data mismatch.
 */
function graphCopy(copy: Copy, page: PageKey): PageGraphCopy {
  const meta = copy.t.pages[page];
  return {
    placeName: copy.f.place,
    title: meta.title(copy.f),
    description: meta.description(copy.f),
    ...(page === "home" || page === "prices" ? { offers: offers(copy) } : {}),
    ...(page === "prices" ? { faq: faqItems(copy) } : {}),
  };
}

/** The `@graph` for one of a point's pages in one language. */
export function locationGraph(point: PlaceView, copy: Copy, page: PageKey, now: Date): JsonLdNode {
  return placeGraph(site, point, page, graphCopy(copy, page), now);
}
