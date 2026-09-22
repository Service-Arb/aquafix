import type { Metadata } from "next";
import { locationMetadata } from "@/features/seo";
import { LocationSubpage } from "@/views/location";
import { loadPoint, type LocationParams } from "@/views/location/server";

type Props = { params: Promise<LocationParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { point, copy } = await loadPoint(params);
  return locationMetadata(point, copy, "prices");
}

export default async function PricesPage({ params }: Props) {
  const { point, copy } = await loadPoint(params);
  return <LocationSubpage copy={copy} point={point} page="prices" now={new Date()} />;
}
