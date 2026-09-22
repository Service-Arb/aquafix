import type { Metadata } from "next";
import { locationMetadata } from "@/features/seo";
import { LocationHome } from "@/views/location";
import { loadPoint, type LocationParams } from "@/views/location/server";

type Props = { params: Promise<LocationParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { point, copy } = await loadPoint(params);
  return locationMetadata(point, copy, "home");
}

export default async function LocationHomePage({ params }: Props) {
  const { point, copy } = await loadPoint(params);
  return <LocationHome copy={copy} point={point} now={new Date()} />;
}
