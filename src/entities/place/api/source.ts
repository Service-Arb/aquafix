import "server-only";
import { createPlaceSource } from "@evinvest/kitstart/server";
import { serverEnv } from "@/shared/config/env";
import { site } from "@/shared/config/site";

/**
 * Every point, baked config merged with the live source (`LOCATIONS_API_URL`;
 * absent → the baked config). A page's read never throws on the source: a 5xx
 * or an unreachable one serves the baked point — its phone is real — and only
 * the source withdrawing a point (a 410, or a 404 in its own JSON) makes it a
 * 404. The sitemap is the one strict reader (`getPlaceStrict`).
 */
export const placeSource = createPlaceSource(site, { baseUrl: () => serverEnv().locationsApiUrl });
