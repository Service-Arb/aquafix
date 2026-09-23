import type { Locale } from "@/shared/config/i18n";
import { TRADE } from "@/shared/config/site";
import type { CopySlice } from "@/shared/landing/core/content";
import { formatEur } from "@/shared/lib/money";
import { priceOf } from "./model/catalogue";
import { EN } from "./model/en";
import { FR } from "./model/fr";
import type { Facts, Text } from "./model/types";

export type * from "./model/types";
export {
  JOB_IDS,
  NAV_IDS,
  NAV_SUFFIX,
  PRICE_LIST,
  SERVICE_LIST,
  WORK_IDS,
  priceOf,
  type JobId,
  type NavId,
  type PriceId,
  type PriceRow,
  type ServiceId,
  type WorkId,
} from "./model/catalogue";

const TEXT = { fr: FR, en: EN } satisfies Record<Locale, Text>;

export function text(locale: Locale): Text {
  return TEXT[locale];
}

/** The facts one point's copy quotes, in one language. */
export function factsFor(input: { locale: Locale; place: string; phone: string }): Facts {
  const { locale } = input;
  return {
    locale,
    place: input.place,
    phone: input.phone,
    price: id => formatEur(priceOf(id), locale),
    callout: formatEur(TRADE.calloutEur, locale),
    surcharge: formatEur(TRADE.surchargeEur, locale),
    siret: TRADE.siret,
    insurer: TRADE.decennale.insurer,
    policy: TRADE.decennale.policy,
    radiusKm: TRADE.radiusKm,
  };
}

/** What a section needs to say something: the language, its words, and the facts they quote. */
export type Copy = CopySlice<Locale, Text, Facts>;

/**
 * A widget's slice of the copy: `CopyOf<Pick<Text, "callLabel">>` says the
 * widget prints the call label and nothing else. The whole `Copy` is
 * assignable to it, so callers still pass one object.
 */
export type CopyOf<T> = CopySlice<Locale, T, Facts>;

export function copyFor(input: { locale: Locale; place: string; phone: string }): Copy {
  return { locale: input.locale, t: text(input.locale), f: factsFor(input) };
}
