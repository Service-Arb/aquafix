import { sitemapRoute } from "@evinvest/kitstart/next";
import { placeSource } from "@/entities/place/server";
import { site } from "@/shared/config/site";

/**
 * One sitemap per host: a sitemap may only list URLs on its own host, and a
 * point's canonical host is its subdomain; the apex lists the brand page. An
 * unpublished point is left out entirely. Rendered per request (it reads the
 * Host header), and strict: with a live source configured, an unreachable
 * source throws — a 5xx makes a crawler keep its last copy, where an empty or
 * truncated sitemap tells it the points are gone (site_conductor#184).
 */
export const dynamic = "force-dynamic";

export default sitemapRoute(site, placeSource);
