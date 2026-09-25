import type { CopySlice, QuestionAnswer } from "@evinvest/kitstart";
import type { Locale } from "@/shared/config/i18n";
import { TRADE } from "@/shared/config/site";
import { formatEur } from "@/shared/lib/money";
import { formatRating } from "@/shared/lib/rating";
import { priceOf } from "./model/catalogue";
import { EN } from "./model/en";
import { FR } from "./model/fr";
import type { Facts, ShownRating, Text } from "./model/types";

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
    rating: shown(TRADE.proofRating, locale, false),
  };
}

function shown(rating: { value: number; count: number }, locale: Locale, google: boolean): ShownRating {
  return { ...formatRating(rating, locale), stars: Math.round(rating.value), google };
}

/**
 * The copy with Google's rating in place of the draft's, when the live source
 * has a fresh one (`freshRating`, the rule schema.org follows) — so the
 * header, the stats and the reviews line say one number, and only a real one
 * is called Google's.
 */
export function withLiveRating(copy: Copy, live: { value: number; count: number } | null): Copy {
  if (!live) return copy;
  return { ...copy, f: { ...copy.f, rating: shown(live, copy.locale, true) } };
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

/** The FAQ as the page prints it and the FAQPage node says it: one reading of the copy. */
export function faqItems(copy: Copy): QuestionAnswer[] {
  return copy.t.faqs.map(item => ({ q: item.q(copy.f), a: item.a(copy.f) }));
}
