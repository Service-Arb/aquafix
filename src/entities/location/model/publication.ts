import type { Location } from "./types";

/**
 * The fields that make a point's page about *that* point. Google's spam policy
 * names "many similar pages that funnel to one business" as doorway pages, and
 * a network of subdomains that differ only by address is exactly that. So a
 * point is indexable only once it says something its neighbours cannot: what
 * the place looks like, how to find it, where its van goes, and when it opens.
 */
export type PublicationField = "storefrontPhoto" | "landmark" | "serviceArea" | "hours";

/** What is still missing; empty means the point may be indexed. */
export function publicationGaps(location: Location): PublicationField[] {
  const gaps: PublicationField[] = [];
  if (!location.storefrontPhoto) gaps.push("storefrontPhoto");
  if (!location.landmark || Object.values(location.landmark).some(v => v.trim() === "")) gaps.push("landmark");
  if (!location.serviceArea || location.serviceArea.length === 0) gaps.push("serviceArea");
  if (!location.hours || location.hours.length === 0) gaps.push("hours");
  return gaps;
}

/**
 * An unpublished point still answers — its phone is real and someone may have
 * been given the link — but it carries `noindex` and stays out of the sitemap.
 */
export function isPublished(location: Location): boolean {
  return publicationGaps(location).length === 0;
}
