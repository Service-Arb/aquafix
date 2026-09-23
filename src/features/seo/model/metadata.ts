import type { Metadata } from "next";
import type { Copy } from "@/entities/content";
import { brandOrigin, isPublished, placeOrigin, type PlaceView } from "@/entities/place";
import { site, PAGES, type PageKey } from "@/shared/config/site";
import { i18n, LOCALES, OG_LOCALE, type Locale } from "@/shared/config/i18n";

/** The OG card, rendered at runtime by `app/og`; apex, so it never needs a rewrite. */
export function ogImageUrl(query: { slug?: string; locale: Locale; page?: PageKey }): string {
  const params = new URLSearchParams({ lang: query.locale });
  if (query.slug) params.set("l", query.slug);
  if (query.page) params.set("p", query.page);
  return `${brandOrigin()}/og?${params.toString()}`;
}

function others(locale: Locale): string[] {
  return LOCALES.filter(l => l !== locale).map(l => OG_LOCALE[l]);
}

/**
 * The `<head>` of a point's page. Every string is read from the copy — the
 * description here is the same field the OG card and the sitemap read.
 *
 * Each language version is its own indexable URL, self-canonical, naming the
 * whole cluster in `hreflang` with `x-default` on French. The canonical host is
 * always the point's subdomain, so the apex fallback path never competes.
 * An unpublished point answers `noindex` — see `publicationGaps`.
 */
export function locationMetadata(point: PlaceView, copy: Copy, page: PageKey): Metadata {
  const p = copy.t.pages[page];
  const title = page === "home" ? `${site.brand.name} — ${p.title(copy.f)}` : `${p.title(copy.f)} · ${site.brand.name}`;
  const description = p.description(copy.f);
  const canonical = point.url(PAGES[page]);
  const image = ogImageUrl({ slug: point.place.slug, locale: copy.locale, page });
  return {
    title,
    description,
    robots: isPublished(point.place) ? { index: true, follow: true } : { index: false, follow: true },
    alternates: {
      canonical,
      languages: i18n.languageAlternates(PAGES[page] || "/", placeOrigin(point.place.slug)),
    },
    openGraph: {
      type: "website",
      siteName: site.brand.name,
      title,
      description,
      url: canonical,
      locale: OG_LOCALE[copy.locale],
      alternateLocale: others(copy.locale),
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export function brandMetadata(copy: Copy): Metadata {
  const b = copy.t.brandPage;
  const canonical = `${brandOrigin()}/${copy.locale}`;
  return {
    title: b.title,
    description: b.description,
    alternates: { canonical, languages: i18n.languageAlternates("/", brandOrigin()) },
    openGraph: {
      type: "website",
      siteName: site.brand.name,
      title: b.title,
      description: b.description,
      url: canonical,
      locale: OG_LOCALE[copy.locale],
      alternateLocale: others(copy.locale),
      images: [{ url: ogImageUrl({ locale: copy.locale }), width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

/** Status pages must never be indexed nor appear in the sitemap. */
export function statusMetadata(title: string): Metadata {
  return { title: `${title} · ${site.brand.name}`, robots: { index: false, follow: false } };
}
