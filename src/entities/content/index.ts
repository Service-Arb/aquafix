import { BRAND } from "@/shared/config/brand";
import type { Locale } from "@/shared/config/i18n";
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

const TEXT: Record<Locale, Text> = { fr: FR, en: EN };

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
    callout: formatEur(BRAND.calloutEur, locale),
    surcharge: formatEur(BRAND.surchargeEur, locale),
    siret: BRAND.siret,
    insurer: BRAND.decennale.insurer,
    policy: BRAND.decennale.policy,
    radiusKm: BRAND.radiusKm,
  };
}

/** What a section needs to say something: the language, its words, and the facts they quote. */
export interface Copy {
  locale: Locale;
  t: Text;
  f: Facts;
}

export function copyFor(input: { locale: Locale; place: string; phone: string }): Copy {
  return { locale: input.locale, t: text(input.locale), f: factsFor(input) };
}
