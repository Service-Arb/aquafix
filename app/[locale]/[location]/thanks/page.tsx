import type { Metadata } from "next";
import { statusMetadata } from "@/features/seo";
import { thanksChannel, thanksSuffix } from "@evinvest/kitstart";
import type { Copy } from "@/entities/content";
import { LocationStatus } from "@/views/location/status";
import { loadPoint, type LocationParams } from "@/views/location/server";

/**
 * Per request: the text follows `?channel=`. Next cannot tell at build — the
 * points are rendered on demand — and a static render that met
 * `searchParams` failed with DYNAMIC_SERVER_USAGE. Noindex and reached only by
 * a lead, so nothing is lost by not caching it.
 */
export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;
type Props = { params: Promise<LocationParams>; searchParams: Promise<Search> };

// A callback's 303 says so (`?channel=callback`): it is promised a call, not
// the quote's SMS.
const statusFor = (copy: Copy, search: Search) =>
  thanksChannel(search) === "callback" ? copy.t.thanksCallback : copy.t.thanks;

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { copy } = await loadPoint(params);
  return statusMetadata(statusFor(copy, await searchParams).title);
}

/** Where the form's 303 lands. A real, successful page — and never indexed. */
export default async function ThanksPage({ params, searchParams }: Props) {
  const { point, copy } = await loadPoint(params);
  const search = await searchParams;
  return (
    <LocationStatus
      copy={copy}
      point={point}
      status={statusFor(copy, search)}
      suffix={thanksSuffix(thanksChannel(search))}
    />
  );
}
