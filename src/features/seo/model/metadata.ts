import { brandMetadata as kitBrandMetadata, placeMetadata, statusMetadata as kitStatusMetadata } from "@evinvest/kitstart/next";
import type { Metadata } from "next";
import type { BrandPageCopy, CopyOf, PageMetaCopy } from "@/entities/content";
import type { PlaceView } from "@/entities/place";
import { site, type PageKey } from "@/shared/config/site";

/** `<head>` reads a page's title and description, nothing else. */
export type PageMetaSlice = CopyOf<{ pages: Record<PageKey, PageMetaCopy> }>;
export type BrandMetaSlice = CopyOf<{ brandPage: Pick<BrandPageCopy, "title" | "description"> }>;

/**
 * The `<head>` of a point's page — kitstart's `placeMetadata` over this
 * page's copy. Every string is read from the copy: the description here is
 * the same field the OG card and the sitemap read. The canonical host is
 * always the point's subdomain, and an unpublished point answers `noindex`.
 */
export function locationMetadata(point: PlaceView, copy: PageMetaSlice, page: PageKey): Metadata {
  const meta = copy.t.pages[page];
  return placeMetadata(site, point, page, { title: meta.title(copy.f), description: meta.description(copy.f) });
}

export function brandMetadata(copy: BrandMetaSlice): Metadata {
  const { title, description } = copy.t.brandPage;
  return kitBrandMetadata(site, copy.locale, { title, description });
}

/** Status pages must never be indexed nor appear in the sitemap. */
export function statusMetadata(title: string): Metadata {
  return kitStatusMetadata(site, title);
}
