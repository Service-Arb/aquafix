import type { ReactNode } from "react";
import { AnalyticsBoundary } from "@/features/analytics";
import { serverEnv } from "@/shared/config/env";
import { loadPoint, type LocationParams } from "@/views/location/server";

/**
 * Rendered per request: the point's live fields ride on the fetch's own TTL,
 * and a prerender at build — in a sandbox with no network — would bake the
 * fallback into the artefact.
 */
export const dynamic = "force-dynamic";

export default async function LocationLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<LocationParams>;
}) {
  const { point } = await loadPoint(params);
  const env = serverEnv();
  // The key is read per request from the container, not inlined at build:
  // the image carries no secret, and PostHog's project key is public anyway.
  return (
    <AnalyticsBoundary target={{ key: env.posthogKey, host: env.posthogHost }} locationId={point.location.slug}>
      {children}
    </AnalyticsBoundary>
  );
}
