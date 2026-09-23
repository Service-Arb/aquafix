import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { copyFor } from "@/entities/content";
import { statusMetadata } from "@/features/seo";
import { site } from "@/shared/config/site";
import { isLocale, perLocale } from "@/shared/config/i18n";
import { THANKS } from "@/shared/landing/core/routing";
import { StatusScreen } from "@/widgets/status-screen";

type Props = { params: Promise<{ locale: string }> };

async function brandCopy(params: Props["params"]) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return copyFor({ locale, place: site.brand.name, phone: site.brand.phone });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return statusMetadata((await brandCopy(params)).t.thanks.title);
}

/**
 * Where a lead with no point lands — a form from before the points existed, or
 * one naming a point we no longer have. The lead is stored all the same.
 */
export default async function BrandThanksPage({ params }: Props) {
  const copy = await brandCopy(params);
  return (
    <StatusScreen
      copy={copy}
      status={copy.t.thanks}
      target={{
        phone: site.brand.phone,
        home: `/${copy.locale}`,
        retry: `/${copy.locale}`,
        langHrefs: perLocale(l => `/${l}${THANKS}`),
      }}
    />
  );
}
