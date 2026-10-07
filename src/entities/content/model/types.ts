import type {
  CoreText,
  LeadCaptureMessengerText,
  LeadCaptureText,
  MessengerKind,
  PageMetaCopy as CorePageMetaCopy,
  QuoteFormCopy as CoreQuoteFormCopy,
  Said as CoreSaid,
  StatusCopy as CoreStatusCopy,
} from "@evinvest/kitstart";
import type { Locale } from "@/shared/config/i18n";
import type { Urgency } from "@/shared/config/lead";
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
  /** The rating the page prints — see `ShownRating`. */
  rating: ShownRating;
}

/**
 * A rating, formatted: the owner's placeholder (`TRADE.proofRating`), or
 * Google's own while the live source's copy is fresh — the same rule
 * schema.org follows. `google` says which, so only a real one is called Google's.
 */
export interface ShownRating {
  value: string;
  count: string;
  /** Whole stars, for the row printed beside the value. */
  stars: number;
  google: boolean;
}

/** A sentence that quotes a fact. */
export type Said = CoreSaid<Facts>;

export type PageMetaCopy = CorePageMetaCopy<Facts>;

export interface PageCopy extends PageMetaCopy {
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

export type { StatusAction } from "@evinvest/kitstart";

export type StatusCopy = CoreStatusCopy<Facts>;

/** The shared frame plus the three fields a plumbing quote asks for. */
export interface QuoteFormCopy extends CoreQuoteFormCopy<Facts> {
  /** Each field's question: hidden on one screen (placeholders), a screen's heading in steps. */
  jobLabel: string;
  zipLabel: string;
  mobileLabel: string;
  zipPlaceholder: string;
  mobilePlaceholder: string;
  /** The one line under the mobile: when the price comes, and what the number is for. */
  afterPhone: string;
  /** The way out to a call back, under the card: the ask, then the link that opens it. */
  callbackAsk: string;
  callback: string;
  /** `layout="steps"`: on from the postcode, and back one screen. */
  next: string;
  back: string;
  /** `lead_form` `c` (docs/EXPERIMENTS.md): how urgent, asked first. */
  urgency: UrgencyCopy;
  /** `lead_channel` (docs/EXPERIMENTS.md): WhatsApp and the bot in the card. */
  messenger: MessengerCopy;
}

/**
 * The words of `lead_channel`'s arms (Figma, Aquafix "Lead form A/B", the
 * messengers v3 section 78:642), laid over kitstart's messenger defaults.
 */
export interface MessengerCopy {
  /** The kit's messenger words where this brand says them its own way; a key left out is the kit's. */
  text: Partial<LeadCaptureMessengerText>;
  /** One board's own wording of a key, over `text` — only while that board is drawn. */
  byKind: { readonly [K in MessengerKind]?: Partial<LeadCaptureText> };
  /** Under the phone where the arm asks it for a call: this test promises no text message. */
  callAfterPhone: string;
  /** The submit where the arm asks the phone for a call. */
  callSubmit: string;
  /** AQ-3's success in the card, over the photo ask; `{phone}` the number as typed. */
  doneTitle: string;
  doneBody: string;
  /** The lead mail's word for AQ-6's "not urgent" (`urgency=later`). */
  notUrgent: string;
}

export interface UrgencyCopy {
  question: string;
  /** Each answer's title and the line under it; the title also names it in the lead mail. */
  options: Record<Urgency, { label: string; hint: string }>;
  /** "Today" turns the form into a call back: its heading, its lede, the line under the mobile, the consent, the submit. */
  callTitle: string;
  callLede: string;
  callAfterPhone: string;
  callConsent: string;
  callSubmit: string;
}

export interface HomeCopy {
  eyebrow: Said;
  /** Three lines, hard-broken; none longer than ~15 characters. */
  display: readonly [string, string, string];
  lede: Said;
  cta: string;
  /** The fourth trust badge, after `statusStrip`'s three. */
  decennaleBadge: string;
  /** The `hero_call_first` treatment's mobile actions (docs/EXPERIMENTS.md). */
  callFirst: { call: string; writtenQuote: string };
  /** The header's rating, beside the phone. */
  headerRating: Said;
  stats: (f: Facts) => readonly [Stat, Stat, Stat, Stat];
  workEyebrow: string;
  workTitle: string;
  work: Record<WorkId, { caption: string; body: string }>;
  workMore: string;
  workClose: string;
  pricesNote: Said;
  guaranteeEyebrow: string;
  guaranteeTitle: string;
  guaranteeLink: string;
  reviewsEyebrow: string;
  reviewsTitle: string;
  reviewsRating: Said;
  /** Before the phone, which the band prints as a `tel:` link. */
  reviewsCallAside: string;
  coverageEyebrow: Said;
  coverageTitle: string;
  coverageLede: Said;
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
  /** The proof card's action on the apex, which has no form: it goes to the list. */
  chooseCta: string;
}

/**
 * Every string that differs between languages. `FR` and `EN` are two objects
 * of this one type, checked with `satisfies`: a field added to one and not the
 * other is a compile error, so there is no missing-key fallback and no drift
 * audit. Language-free facts are in `catalogue.ts`, `site` and `TRADE`, not here.
 *
 * It extends `CoreText`, the words the shared machinery prints; everything
 * else is this brand's own.
 */
export interface Text extends CoreText<PageKey, Facts> {
  pages: Record<PageKey, PageCopy>;
  brandPage: BrandPageCopy;
  nav: Record<NavId, string>;
  promise: string;
  bookingHours: string;
  /** The bookings line over a point's real hours, in place of `bookingHours`. */
  bookingHoursOf: (hours: string) => string;
  headerPhoneLabel: string;
  heroPhotoAlt: string;
  /** The one CTA label, so a copy change cannot land on some buttons only. */
  cta: string;
  ctaShort: string;
  callLabel: Said;
  whatsappLabel: string;
  /** The same channel where only a word fits. */
  whatsappShort: string;
  /** The mobile call bar's accessible name. */
  callBarLabel: string;
  menuLabel: string;
  whatsappMessage: Said;
  quoteForm: QuoteFormCopy;
  jobs: Record<JobId, string>;
  /** A job on a card of the lead form, under `sm`, where the whole label would wrap to four lines. */
  jobsShort: Record<JobId, string>;
  prices: Record<PriceId, { job: string; time: string }>;
  priceColumns: { job: string; price: string; time: string };
  /** The price table's `<caption>`, for a screen reader. */
  priceCaption: string;
  home: HomeCopy;
  pillars: readonly [Pillar, Pillar, Pillar];
  guaranteeCtaAside: Said;
  reviews: readonly [Review, Review, Review];
  services: { head: Head3; items: Record<ServiceId, { name: string; body: string }>; from: string; quoted: string };
  faqHead: {
    eyebrow: string;
    title: string;
    /** Around the phone, which the head prints as a `tel:` link. */
    callAside: readonly [string, string];
  };
  faqs: readonly [Faq, Faq, Faq, Faq, Faq];
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
    legal: readonly string[];
    siret: Said;
    company: Record<"guarantee" | "prices" | "reviews" | "crew" | "contact", string>;
  };
  statusStrip: readonly [string, string, string];
  notFound: StatusCopy;
  serverError: StatusCopy;
  thanks: StatusCopy;
  /** After "call me back": a call, not the quote's SMS — and no time we cannot keep. */
  thanksCallback: StatusCopy;
  backHome: string;
  tryAgain: string;
  langLabel: string;
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
