import { statusTarget, thanksChannel } from "@evinvest/kitstart";
import { loadLocale } from "@evinvest/kitstart/next";
import type { Metadata } from "next";
import { copyFor, type Copy } from "@/entities/content";
import { statusMetadata } from "@/features/seo";
import { CARD, site } from "@/shared/config/site";
import { StatusScreen } from "@/widgets/status-screen";

/** Per request: the text follows `?channel=`. Noindex and reached only by a lead, so nothing is lost by not caching it. */
export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;
type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Search> };

async function brandCopy(params: Props["params"]) {
  const locale = await loadLocale(site, params);
  return copyFor({ locale, place: site.brand.name, phone: CARD.phone });
}

// A callback is promised a call, not the quote's SMS (`?channel=callback`).
const statusFor = (copy: Copy, search: Search) =>
  thanksChannel(search) === "callback" ? copy.t.thanksCallback : copy.t.thanks;

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  return statusMetadata(statusFor(await brandCopy(params), await searchParams).title);
}

/**
 * Where a lead with no point lands — a form from before the points existed, or
 * one naming a point we no longer have. The lead is stored all the same.
 */
export default async function BrandThanksPage({ params, searchParams }: Props) {
  const copy = await brandCopy(params);
  const search = await searchParams;
  const channel = thanksChannel(search);
  const { home, retry, langHrefs } = statusTarget(site, { locale: copy.locale }, { thanks: true, channel });
  return <StatusScreen copy={copy} status={statusFor(copy, search)} target={{ phone: CARD.phone, home, retry, langHrefs }} />;
}
