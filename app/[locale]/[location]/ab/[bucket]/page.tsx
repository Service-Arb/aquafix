import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locationMetadata } from "@/features/seo";
import { decodeBucket } from "@/shared/lib/experiments";
import { LocationHome } from "@/views/location";
import { loadPoint, type LocationParams } from "@/views/location/server";

/**
 * A point's home under one A/B assignment (`/fr/_royat/ab/ba`). Only the proxy
 * rewrites here (`features/experiments`), so the variant comes from the path
 * and the page stays cached like its control, one entry per combination. The
 * canonical, the links and the schema are the control's: the point's URL has
 * no bucket.
 */
type Props = { params: Promise<LocationParams & { bucket: string }> };

export function generateStaticParams(): { bucket: string }[] {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { point, copy } = await loadPoint(params);
  return locationMetadata(point, copy, "home");
}

export default async function LocationVariantPage({ params }: Props) {
  const variants = decodeBucket((await params).bucket);
  // The proxy writes only real buckets; anything else was typed by hand.
  if (!variants) notFound();
  const { point, copy } = await loadPoint(params);
  return <LocationHome copy={copy} point={point} now={new Date()} variants={variants} />;
}
