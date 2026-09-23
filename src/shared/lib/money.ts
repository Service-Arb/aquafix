import { INTL_TAG, type Locale } from "@/shared/config/i18n";

const formatters = new Map<Locale, Intl.NumberFormat>();

/**
 * `1290` → `"1 290 €"` (fr) / `"€1,290"` (en). The only place an amount becomes
 * a string, so a price table, a service card and a sentence that quotes the
 * call-out cannot disagree — and the schema.org `Offer` reads the same integer.
 */
export function formatEur(amount: number, locale: Locale): string {
  let format = formatters.get(locale);
  if (!format) {
    format = new Intl.NumberFormat(INTL_TAG[locale], {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    });
    formatters.set(locale, format);
  }
  return format.format(amount);
}
