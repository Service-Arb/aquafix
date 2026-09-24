import { loadLocale } from "@evinvest/kitstart/next";
import type { Metadata } from "next";
import { copyFor } from "@/entities/content";
import { placeSource } from "@/entities/place/server";
import { brandMetadata } from "@/features/seo";
import { CARD, site } from "@/shared/config/site";
import { BrandHome } from "@/views/brand";

type Props = { params: Promise<{ locale: string }> };

/** Rendered on first request and cached like a point's pages (see its layout). */
export function generateStaticParams(): Array<{ locale: string }> {
  return [];
}

export const revalidate = 600;

async function brandCopy(params: Props["params"]) {
  const locale = await loadLocale(site, params);
  return copyFor({ locale, place: site.brand.name, phone: CARD.phone });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return brandMetadata(await brandCopy(params));
}

export default async function BrandPage({ params }: Props) {
  const copy = await brandCopy(params);
  return <BrandHome copy={copy} locations={await placeSource.listPlaces(copy.locale, "page")} />;
}
