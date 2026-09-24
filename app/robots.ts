import { robotsRoute } from "@evinvest/kitstart/next";
import { site } from "@/shared/config/site";

/**
 * Allow everything, the AI crawlers by name, and point at the host's own
 * sitemap. Unpublished points are held back by `noindex`, not here, so a
 * crawler can still read the `noindex`.
 */
export const dynamic = "force-dynamic";

export default robotsRoute(site);
