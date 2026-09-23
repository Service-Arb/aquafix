import type { Locale } from "@/shared/config/i18n";
import type { PageKey } from "@/shared/config/site";
import type { JobId, NavId, PriceId, ServiceId, WorkId } from "./catalogue";

/**
 * The facts a sentence may quote. Prose that names the phone, a price or the
 * point's town takes them as an argument instead of spelling them out, so the
 * number on the card and the number in the sentence are the same field.
 */
export interface Facts {
  locale: Locale;
  /** The point's short place name: "Royat", "Lyon Nord". */
  place: string;
  phone: string;
  /** A formatted row of the price list. */
  price: (id: PriceId) => string;
  callout: string;
  surcharge: string;
  siret: string;
  insurer: string;
  policy: string;
  radiusKm: number;
}

/** A sentence that quotes a fact. */
export type Said = (f: Facts) => string;

export interface PageCopy {
  /** `<title>`, the OG title and the breadcrumb label. */
  title: Said;
  /** Read by `<head>`, the OG card and the sitemap — one field, three readers. */
  description: Said;
  eyebrow: string;
  h1: Said;
  lede: string;
}

export interface Head3 {
  eyebrow: string;
  title: Said;
  lede: string;
}

export interface Pillar {
  n: string;
  title: string;
  body: Said;
  /** The mobile frame carries genuinely shorter copy. */
  short: Said;
}

export interface Review {
  stars: 1 | 2 | 3 | 4 | 5;
  body: Said;
  author: string;
  attrib: string;
}

export interface Crew {
  initials: string;
  name: string;
  role: string;
  years: string;
  credential: string;
}

export type StatusAction = "call" | "home" | "retry";

export interface StatusCopy {
  code: string;
  /** The `<title>`: these pages are `noindex` and carry no `PageCopy`. */
  title: string;
  eyebrow: string;
  /** Split at the accented half, which is how the design draws it. */
  headline: readonly [string, string];
  body: Said;
  primary: StatusAction;
  secondary: StatusAction;
}

export interface QuoteFormCopy {
  title: string;
  lede: string;
  submit: string;
  privacy: string;
  reassurance: Said;
  jobLabel: string;
  zipLabel: string;
  mobileLabel: string;
  zipPlaceholder: string;
  mobilePlaceholder: string;
  /** The honeypot's label — read only by a bot filling every field. */
  honeypotLabel: string;
}

export interface HomeCopy {
  eyebrow: Said;
  /** Three lines, hard-broken; none longer than ~15 characters. */
  display: readonly [string, string, string];
  lede: Said;
  cta: string;
  stats: readonly [Stat, Stat, Stat, Stat];
  workTitle: string;
  work: Record<WorkId, { caption: string; body: string }>;
  workMore: string;
  workClose: string;
  pricesTitle: string;
  pricesNote: Said;
  guaranteeTitle: string;
  reviewsTitle: string;
  coverageTitle: string;
  coverageLede: Said;
  mapShow: string;
  mapTitle: Said;
  closingTitle: string;
  closingLede: string;
  backToTop: string;
}

export interface Stat {
  figure: string;
  label: string;
}

export interface BrandPageCopy {
  title: string;
  description: string;
  h1: string;
  lede: string;
  listTitle: string;
  open: string;
}

/**
 * Every string that differs between languages. `FR` and `EN` are two objects
 * of this one type, checked with `satisfies`: a field added to one and not the
 * other is a compile error, so there is no missing-key fallback and no drift
 * audit. Language-free facts are in `catalogue.ts`, `site` and `TRADE`, not here.
 */
export interface Text {
  pages: Record<PageKey, PageCopy>;
  brandPage: BrandPageCopy;
  nav: Record<NavId, string>;
  promise: string;
  emergencyHours: string;
  bookingHours: string;
  headerPhoneLabel: string;
  heroPhotoAlt: string;
  /** The one CTA label, so a copy change cannot land on some buttons only. */
  cta: string;
  ctaShort: string;
  callLabel: Said;
  whatsappLabel: string;
  /** The same channel where only a word fits. */
  whatsappShort: string;
  menuLabel: string;
  whatsappMessage: Said;
  quoteForm: QuoteFormCopy;
  jobs: Record<JobId, string>;
  prices: Record<PriceId, { job: string; time: string }>;
  priceColumns: { job: string; price: string; time: string };
  home: HomeCopy;
  pillars: readonly [Pillar, Pillar, Pillar];
  guaranteeCtaAside: Said;
  reviews: readonly [Review, Review, Review];
  services: { head: Head3; items: Record<ServiceId, { name: string; body: string }>; from: string; quoted: string };
  faqHead: { eyebrow: string; title: string };
  faqs: readonly [Faq, Faq, Faq, Faq, Faq, Faq];
  objectionsHead: Head3;
  objections: readonly [Objection, Objection, Objection, Objection];
  stepsHead: { eyebrow: string; title: string };
  steps: readonly [Step, Step, Step];
  crewHead: Head3;
  crew: readonly [Crew, Crew, Crew, Crew];
  areaHead: Head3;
  inlineCta: { line: string; button: string };
  footer: {
    columns: { services: string; areas: string; company: string; contact: string };
    facts: (f: Facts) => readonly string[];
    legal: readonly string[];
    company: Record<"guarantee" | "prices" | "reviews" | "crew" | "contact", string>;
  };
  statusStrip: readonly [string, string, string];
  notFound: StatusCopy;
  serverError: StatusCopy;
  thanks: StatusCopy;
  backHome: string;
  tryAgain: string;
  langName: string;
}

export interface Faq {
  q: Said;
  a: Said;
}

export interface Objection {
  quote: Said;
  title: string;
  body: Said;
}

export interface Step {
  n: string;
  title: string;
  body: string;
}
