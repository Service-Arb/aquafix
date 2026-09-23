import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { copyFor } from "@/entities/content";
import { listPlaces } from "@/entities/place/server";
import { brandMetadata } from "@/features/seo";
import { site } from "@/shared/config/site";
import { isLocale } from "@/shared/config/i18n";
import { BrandHome } from "@/views/brand";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

async function brandCopy(params: Props["params"]) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return copyFor({ locale, place: site.brand.name, phone: site.brand.phone });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return brandMetadata(await brandCopy(params));
}

export default async function BrandPage({ params }: Props) {
  const copy = await brandCopy(params);
  return <BrandHome copy={copy} locations={await listPlaces(copy.locale, "page")} />;
}
