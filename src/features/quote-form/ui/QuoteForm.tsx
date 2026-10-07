import { LEAD_CAPTURE_TEXT, messengerFacts, type LeadCaptureText } from "@evinvest/kitstart";
import { LeadCapture, type LeadCaptureProps, type LeadIntro } from "@evinvest/kitstart/react";
import { cn } from "@evinvest/uikit";
import type { CopyOf, Text } from "@/entities/content";
import type { PlaceView } from "@/entities/place";
import { LEAD, URGENCIES, URGENCY_FIELD } from "@/shared/config/lead";
import { site } from "@/shared/config/site";
import { leadChannelRunsAt } from "@/shared/lib/lead-channel";
import { AfterPhone, CALLBACK_STEP, CallbackHeading } from "./FormLines";
import { JobIcon } from "./JobIcon";
import { messengerProps, messengerVariantOf, REF_PREFIX, type LeadChannelArm } from "./messenger";
import { COMPACT, STEPS, URGENT_FIRST } from "./parts";
import { ThanksCapture } from "./ThanksCapture";

export type QuoteFormWidgetCopy = CopyOf<Pick<Text, "quoteForm" | "jobs" | "jobsShort">>;

/** `lead_form`'s arms (docs/EXPERIMENTS.md): `a` compact on one screen, `b` step by step, `c` urgency first. */
export type LeadFormArm = "a" | "b" | "c";

/** Every word of the form: the kit's, with this brand's own where it has one. */
function leadText(copy: QuoteFormWidgetCopy, arm: LeadFormArm): LeadCaptureText {
  const q = copy.t.quoteForm;
  const kit = LEAD_CAPTURE_TEXT[copy.locale];
  return {
    ...kit,
    title: q.title,
    lede: q.lede,
    needLabel: q.jobLabel,
    localityLabel: q.zipLabel,
    localityPlaceholder: q.zipPlaceholder,
    phoneLabel: q.mobileLabel,
    phonePlaceholder: q.mobilePlaceholder,
    submit: q.submit,
    // Said once, under the mobile (`afterPhone`).
    privacy: "",
    callback: q.callback,
    stepBack: q.back,
    stepNext: q.next,
    honeypotLabel: q.honeypotLabel,
    // The urgent call back's own words; elsewhere the kit's consent stays as it was.
    ...(arm === "c" ? { callbackConsent: q.urgency.callConsent, callbackSubmit: q.urgency.callSubmit } : {}),
  };
}

/** `c`'s first question: how soon, its answer posted as the lead's `urgency`; "today" is a call back. */
function urgencyIntro(copy: QuoteFormWidgetCopy): LeadIntro {
  const u = copy.t.quoteForm.urgency;
  return {
    label: u.question,
    field: URGENCY_FIELD,
    options: URGENCIES.map(value => ({
      value,
      label: u.options[value].label,
      // The line under the answer's title, in the tile's icon slot — the kit's
      // answer has a label only; the tile stacks it under (`introOption`).
      icon: <span className="text-[13px] font-normal leading-4 text-ink-soft">{u.options[value].hint}</span>,
      channel: value === "today" ? "callback" : "form",
    })),
  };
}

/** What each arm sets on the kit's form, over what they share. */
function armProps(copy: QuoteFormWidgetCopy, arm: LeadFormArm): Partial<LeadCaptureProps> {
  const q = copy.t.quoteForm;
  if (arm === "a") {
    return { layout: "single", needDisplay: "select", focusNext: true, labels: "hidden", classNames: COMPACT, afterPhone: <AfterPhone line={q.afterPhone} /> };
  }
  if (arm === "b") return { layout: "steps", needDisplay: "tiles", classNames: STEPS, afterPhone: <AfterPhone line={q.afterPhone} /> };
  return {
    layout: "steps",
    needDisplay: "cards",
    intro: urgencyIntro(copy),
    classNames: { ...URGENT_FIRST, step: cn(URGENT_FIRST.step, CALLBACK_STEP) },
    afterPhone: (
      <>
        <CallbackHeading title={q.urgency.callTitle} lede={q.urgency.callLede} />
        <AfterPhone line={q.afterPhone} callLine={q.urgency.callAfterPhone} />
      </>
    ),
  };
}

/**
 * kitstart's `LeadCapture` in this brand's card, in the visitor's arm of
 * `lead_form`: the job (not asked again when the visitor tapped one on the
 * page — `data-need` on the work tiles and the price rows), the postcode
 * (filled with the storefront's own, which the kit reads off the place), the
 * mobile, and "call me back" as a line under the card. Over the kit's
 * `QuoteFormShell`, so it still posts before any JavaScript arrives — every
 * screen of `b` and `c` at once — which is when the visitor standing in water
 * submits it.
 *
 * The call and WhatsApp are not repeated in the card: the hero offers both
 * beside it (`HeroActions`) and the call bar under it, so the kit is given no
 * number and keeps to the form and the callback.
 *
 * `channelArm` is the visitor's `lead_channel` arm. At a place with its own
 * WhatsApp (`leadChannelRunsAt`, which the QA menu's labels share) the test runs: every arm,
 * the control `a` included, draws the compact card whatever `lead_form` says
 * and names `lead_channel` on the kit's events — the beacon and `/quote` mark
 * `lead_form`'s `superseded` — and `b`–`g` add their board. Elsewhere (the bot
 * alone, or neither) the test is inert and the card is `lead_form`'s. Every
 * card gives the kit the facts, so every event says `channels_available`.
 */
export function QuoteForm({
  copy,
  point,
  renderedAt,
  arm = "a",
  channelArm = "a",
}: {
  copy: QuoteFormWidgetCopy;
  point: PlaceView;
  renderedAt: number;
  arm?: LeadFormArm;
  channelArm?: LeadChannelArm;
}) {
  const q = copy.t.quoteForm;
  const facts = messengerFacts(site, point.place);
  const runs = leadChannelRunsAt(point.place);
  const variant = runs ? messengerVariantOf(channelArm) : undefined;
  const formArm = runs ? "a" : arm;
  const text = leadText(copy, formArm);
  const props: LeadCaptureProps = {
    place: point.place,
    contact: { phone: null, whatsapp: null },
    messengers: facts,
    refPrefix: REF_PREFIX,
    brand: site.brand.name,
    locale: copy.locale,
    renderedAt,
    wire: LEAD.wire,
    needs: LEAD.subjects.map(id => ({
      value: id,
      label: copy.t.jobs[id],
      // The cards of `c` are a third of a phone wide: a short label there, the whole one in `b`'s tiles.
      ...(formArm === "c" ? { shortLabel: copy.t.jobsShort[id], icon: <JobIcon job={id} /> } : {}),
    })),
    experiment: runs ? { name: "lead_channel", variant: channelArm } : { name: "lead_form", variant: formArm },
    text,
    channelsDisplay: "row",
    channelIcons: { callback: q.callbackAsk },
    head: (
      <div className="flex flex-col gap-[7px]">
        <p className="font-display text-[24px] font-bold leading-[1.1] text-ink md:text-[30px]">{q.title}</p>
        <p className="text-[15px] leading-[18px] text-ink-soft">{q.lede}</p>
      </div>
    ),
    ...armProps(copy, formArm),
    ...(variant ? { messenger: variant, ...messengerProps(copy, variant, facts, text) } : {}),
  };
  if (variant?.kind === "thanks") {
    return <ThanksCapture {...props} doneTitle={q.messenger.doneTitle} doneBody={q.messenger.doneBody} />;
  }
  return <LeadCapture {...props} />;
}
