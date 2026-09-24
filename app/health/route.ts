import { healthRoute } from "@evinvest/kitstart/next";

/** The container's readiness probe: the process answers. */
export const dynamic = "force-dynamic";

export const GET = healthRoute();
