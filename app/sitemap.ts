import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { brandOrigin, isPublished, placeOrigin } from "@/entities/place";
import { placeSource } from "@/entities/place/server";
import { hostSlug } from "@/features/request-routing";
import { DEFAULT_LOCALE, i18n, LOCALES } from "@/shared/config/i18n";
import { PAGE_KEYS, PAGES } from "@/shared/config/site";

/**
 * One sitemap per host: a sitemap may only list URLs on its own host, and a
 * point's canonical host is its subdomain. The apex lists the brand page.
 *
 * Each language version is its own `<url>`, annotated with the whole set
 * *including itself* — one URL with alternates hanging off it leaves the other
 * language told-about but never asked to index. No `<lastmod>`: a deploy
 * timestamp that moves without the content moving is a lie.
 *
 * Rendered per request, and strict: with a live source configured, an
 * unreachable source throws. A 5xx makes a crawler keep its last copy; an
 * empty or truncated sitemap tells it the points are gone (site_conductor#184).
 * An unpublished point — see `publicationGaps` — is left out entirely.
 */
export const dynamic = "force-dynamic";

function cluster(origin: string, suffix: string, priority: number): MetadataRoute.Sitemap {
  const languages = i18n.languageAlternates(suffix || "/", origin);
  return LOCALES.map(locale => ({
    url: `${origin}/${locale}${suffix}`,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slug = hostSlug((await headers()).get("host") ?? "");
  if (!slug) return cluster(brandOrigin(), "", 1);
  const locations = await placeSource.listPlaces(DEFAULT_LOCALE, "sitemap");
  const location = locations.find(l => l.slug === slug);
  if (!location || !isPublished(location)) return [];
  return PAGE_KEYS.flatMap(page => cluster(placeOrigin(slug), PAGES[page], page === "home" ? 1 : 0.8));
}
