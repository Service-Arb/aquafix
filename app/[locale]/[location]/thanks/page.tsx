import type { Metadata } from "next";
import { statusMetadata } from "@/features/seo";
import { THANKS } from "@/shared/config/routes";
import { LocationStatus } from "@/views/location";
import { loadPoint, type LocationParams } from "@/views/location/server";

type Props = { params: Promise<LocationParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { copy } = await loadPoint(params);
  return statusMetadata(copy.t.thanks.title);
}

/** Where the form's 303 lands. A real, successful page — and never indexed. */
export default async function ThanksPage({ params }: Props) {
  const { point, copy } = await loadPoint(params);
  return <LocationStatus copy={copy} point={point} status={copy.t.thanks} suffix={THANKS} />;
}
