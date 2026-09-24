import { INTL_TAG, type Locale } from "@/shared/config/i18n";

/**
 * `4.9` → `"4,9"` (fr) / `"4.9"` (en), and a count in the same locale. One
 * decimal always: Google prints `5,0`, not `5`.
 */
export function formatRating(rating: { value: number; count: number }, locale: Locale): { value: string; count: string } {
  const tag = INTL_TAG[locale];
  return {
    value: new Intl.NumberFormat(tag, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(rating.value),
    count: new Intl.NumberFormat(tag, { maximumFractionDigits: 0 }).format(rating.count),
  };
}
