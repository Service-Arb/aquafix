import { createLocaleRegistry } from "@evinvest/i18n";

/**
 * Both languages carry a prefix: the brand launches in two languages with no
 * legacy URLs to keep, so there is no unprefixed canonical to protect. French
 * is the default — the points are in Auvergne and Lyon — and is what a
 * header-less crawler is sent to.
 */
export const i18n = createLocaleRegistry({
  locales: ["fr", "en"],
  labels: { fr: "Français", en: "English" },
  default: "fr",
  prefixDefaultLocale: true,
  hreflang: { fr: "fr-FR" },
});

export type Locale = (typeof i18n.locales)[number];

export const LOCALES: readonly Locale[] = i18n.locales;
export const DEFAULT_LOCALE: Locale = i18n.defaultLocale;

export function isLocale(value: unknown): value is Locale {
  return i18n.isLocale(value);
}

/** `Intl` tag for numbers and money, one per locale. */
export const INTL_TAG: Record<Locale, string> = { fr: "fr-FR", en: "en-IE" };

/** One value per locale — spelled out, so a third locale is a compile error here. */
export function perLocale<T>(fn: (locale: Locale) => T): Record<Locale, T> {
  return { fr: fn("fr"), en: fn("en") };
}
