import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { brandOrigin, locationOrigin } from "@/entities/location";
import { hostSlug } from "@/features/request-routing";

export const dynamic = "force-dynamic";

/**
 * Allow everything, and name the AI crawlers explicitly — several treat a bare
 * wildcard as ambiguous and an explicit `Allow` as consent. The sitemap is the
 * host's own; unpublished points are held back by `noindex`, not here, so a
 * crawler can still read the `noindex`.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const slug = hostSlug((await headers()).get("host") ?? "");
  const origin = slug ? locationOrigin(slug) : brandOrigin();
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"], allow: "/" },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
