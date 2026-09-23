import type { ReactNode } from "react";
import { AnalyticsBoundary } from "@/features/analytics";
import { serverEnv } from "@/shared/config/env";
import { loadPoint, type LocationParams } from "@/views/location/server";

/**
 * Incremental static regeneration. No page is prerendered at build — in a
 * sandbox with no network that would bake the fallback into the artefact —
 * so the list is empty: the first request for a path renders it, the result
 * is cached and served as a static page, and it re-renders in the background
 * once the live fetch's TTL (`LOCATION_REVALIDATE_SECONDS`) has passed. A
 * failing source during that re-render keeps the last good page.
 */
export function generateStaticParams(): LocationParams[] {
  return [];
}

/**
 * The ceiling, in seconds, for a page whose render made no live fetch (no
 * `LOCATIONS_API_URL`): without it Next would keep such a page for a year.
 * `LOCATION_REVALIDATE_SECONDS`, spelled out because Next reads this export
 * statically.
 */
export const revalidate = 600;

export default async function LocationLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<LocationParams>;
}) {
  const { point } = await loadPoint(params);
  const env = serverEnv();
  // The key is read from the container when the page renders, not inlined at
  // build: the image carries no secret, and PostHog's project key is public.
  return (
    <AnalyticsBoundary target={{ key: env.posthogKey, host: env.posthogHost }} locationId={point.location.slug}>
      {children}
    </AnalyticsBoundary>
  );
}
