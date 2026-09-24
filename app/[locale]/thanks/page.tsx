import { statusTarget } from "@evinvest/kitstart";
import { loadLocale } from "@evinvest/kitstart/next";
import type { Metadata } from "next";
import { copyFor } from "@/entities/content";
import { statusMetadata } from "@/features/seo";
import { CARD, site } from "@/shared/config/site";
import { StatusScreen } from "@/widgets/status-screen";

type Props = { params: Promise<{ locale: string }> };

async function brandCopy(params: Props["params"]) {
  const locale = await loadLocale(site, params);
  return copyFor({ locale, place: site.brand.name, phone: CARD.phone });
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
  const { home, retry, langHrefs } = statusTarget(site, { locale: copy.locale }, { thanks: true });
  return <StatusScreen copy={copy} status={copy.t.thanks} target={{ phone: CARD.phone, home, retry, langHrefs }} />;
}
