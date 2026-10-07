import type { MessengerKind } from "@evinvest/kitstart";
import type { LeadCapturePart, PartClassNames } from "@evinvest/kitstart/react";
import { CTA_FACE } from "@/shared/ui/brand";

/**
 * The card's classes, per arm of `lead_form` — numbers from the Aquafix Figma
 * page "Lead form A/B" (54:524).
 */

/** The kit's `xl` button over `LeadCapture`'s `touch`: the brand's CTA, as every other one on the page. */
const CTA = `min-h-0 px-[var(--control-px)] py-[var(--control-py)] text-[length:var(--control-text)] ${CTA_FACE}`;

/**
 * On top of the kit's `lg` control: the 52px Figma height, a 24px line +
 * 2×13px + 2×1px border. 16px type at every width, where the compact frame
 * draws 14: under 16px iOS zooms the page into a focused field.
 */
const FIELD = "h-auto w-full border border-input py-[13px] text-ink shadow-none";

/**
 * "Pas envie de taper ? Rappelez-moi": the callback's summary under the card as
 * a line of text, not a button. On `others`, so the callback that leads when
 * the point is closed keeps its button. A block summary makes the ask (the
 * channel's icon slot, an inline block) escape the link's underline.
 */
const CALLBACK_LINE = [
  "justify-center",
  "[&_summary]:block [&_summary]:h-auto [&_summary]:min-h-0 [&_summary]:border-0 [&_summary]:bg-transparent [&_summary]:p-0 [&_summary]:shadow-none",
  "[&_summary]:text-center [&_summary]:font-sans [&_summary]:text-[14px] [&_summary]:font-semibold [&_summary]:leading-[17px] [&_summary]:text-primary-ink",
  "[&_summary]:underline [&_summary]:underline-offset-2 [&_summary:hover]:bg-transparent",
].join(" ");

/** What every arm shares: the light card, its head, the CTA, the line under the mobile, the callback line. */
const CARD: PartClassNames<LeadCapturePart> = {
  // A light island inside a dark band.
  root: "light gap-5 rounded-[var(--corner-float)] bg-background px-6 py-7 text-ink shadow-overlay md:px-[34px] md:pb-[30px] md:pt-8",
  field: "w-full",
  submit: CTA,
  channel: CTA,
  // The ask is the callback's icon slot: hidden on the button that leads when closed.
  primary: "[&>span[aria-hidden]]:hidden",
  channelIcon: "me-2 inline-block font-normal text-ink-soft",
  others: CALLBACK_LINE,
  callbackLede: "text-[15px] leading-[normal]",
  callbackSubmit: CTA,
  consent: "min-h-0 gap-2.5 text-[13px] leading-4 text-ink-soft",
};

/** `a`: one screen — the job's select, the postcode, the mobile — 12px apart, labels for assistive technology only. */
export const COMPACT: PartClassNames<LeadCapturePart> = {
  ...CARD,
  form: "gap-3",
  contact: "gap-3",
  control: `${FIELD} rounded-[var(--control-radius)] bg-background px-3`,
};

/** A chip of an answered screen: a pill with a tick; one "Modifier" after the last. */
const ANSWER = [
  "h-auto min-h-0 gap-1.5 border-0 bg-transparent p-0 text-[12.5px] leading-[normal] shadow-none hover:bg-transparent",
  "[&>span:nth-child(2)]:rounded-full [&>span:nth-child(2)]:border [&>span:nth-child(2)]:border-border [&>span:nth-child(2)]:bg-muted",
  "[&>span:nth-child(2)]:px-[11px] [&>span:nth-child(2)]:py-[5px] [&>span:nth-child(2)]:text-ink-mid",
  "[&>span:nth-child(2)]:before:me-1.5 [&>span:nth-child(2)]:before:font-semibold [&>span:nth-child(2)]:before:text-positive [&>span:nth-child(2)]:before:content-['✓']",
  "[&>span:nth-child(3)]:font-medium",
].join(" ");

/** `b` and `c`: one question per screen, the question its heading, the fields on the card plane. */
export const STEPS: PartClassNames<LeadCapturePart> = {
  ...CARD,
  // The head is the first screen's only: once a screen is answered its chips lead.
  root: `${CARD.root ?? ""} [&:has(ul[data-lead-chrome])>:first-child]:hidden`,
  label: "font-display text-[20px] font-bold leading-[22px] text-ink",
  control: `${FIELD} rounded-[var(--corner-control)] bg-card`,
  step: "gap-3",
  progress: "gap-3 [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-primary [&_[data-slot=progress]]:bg-muted",
  stepBack: "h-auto min-h-0 py-0 text-[14px] font-semibold leading-[17px] text-ink-mid",
  answers: "gap-1.5 [&>li:not(:last-child)_span:nth-child(3)]:hidden",
  answer: ANSWER,
  stepNext: CTA,
  needs: "grid-cols-2",
  need: "min-h-14 justify-center rounded-[var(--corner-control)] bg-card p-2.5 text-center text-[14px] font-medium leading-[17px]",
};

/**
 * `c`: the urgency first — a title and the line under it on each answer —
 * then the jobs as cards with their icons.
 */
export const URGENT_FIRST: PartClassNames<LeadCapturePart> = {
  ...STEPS,
  introOption: "min-h-16 flex-col-reverse items-start justify-center gap-0.5 rounded-[var(--corner-control)] bg-card px-4 py-2.5 text-[15px] font-medium leading-[18px]",
  needs: "grid-cols-3 sm:grid-cols-3",
  need: "min-h-[92px] gap-2 rounded-[var(--corner-tile)] bg-card px-1.5 py-3 text-[13px] font-medium leading-4",
  icon: "text-primary-ink",
};

/**
 * The kit's messenger buttons (`MessengerCta`, the squares, «Être rappelé»)
 * take no part of their own: the brand's CTA face reaches them from the
 * variant's wrapper (`messenger`).
 */
const MESSENGER_BUTTONS = "[&_[data-slot=button]]:font-display [&_[data-slot=button]]:[font-weight:600]";

/** The ticked small print under a field, as `AfterPhone` draws it — on the select's hint, not on the in-app one. */
const MESSENGER_HINT = "text-[13px] font-medium leading-4 text-ink-mid [p&]:flex [p&]:gap-2 [p&]:before:font-semibold [p&]:before:text-positive [p&]:before:content-['✓']";

/**
 * `lead_channel`'s parts over the compact card (Figma, Aquafix "Lead form
 * A/B", «Мессенджеры v3»): every state of an arm one height — the channel's
 * slot 92px (the phone and its line, or the message ready), `swap`'s 52px
 * (the WhatsApp button, or the phone). `relative` holds the kit's «Message
 * envoyé ?» screen over the card, padded as the card is.
 */
const MESSENGER: PartClassNames<LeadCapturePart> = {
  ...COMPACT,
  root: `${COMPACT.root ?? ""} relative`,
  messenger: MESSENGER_BUTTONS,
  messengerSlot: "h-[92px]",
  messengerPreview: "h-full items-center gap-3 rounded-[var(--corner-control)] bg-primary/8 px-4 py-3",
  messengerHint: MESSENGER_HINT,
  messengerQr: "rounded-[var(--corner-control)]",
  messengerReturn: "rounded-[var(--corner-float)] px-6 py-7 md:px-[34px] md:pb-[30px] md:pt-8",
};

/** What one board sets over {@link MESSENGER}. */
const BY_KIND: { readonly [K in MessengerKind]?: PartClassNames<LeadCapturePart> } = {
  // AQ-1: the picker is the phone field's frame, 52px as every field.
  select: { messengerPicker: "h-[52px]" },
  // AQ-2: «WhatsApp | Appel» on a muted track, the picked one lifted.
  segment: {
    messengerPicker: "h-12 rounded-[var(--corner-control)] bg-muted p-1",
    messengerOption: "h-10 text-[15px] font-medium text-ink-soft data-[state=on]:bg-card data-[state=on]:shadow-sm",
  },
  // AQ-4: slot A is the WhatsApp button or the phone, 52px; row B under it.
  swap: { messengerSlot: "h-[52px] [&>a]:h-full", messengerSquare: "size-[49px] min-h-0 rounded-[var(--corner-control)]" },
  // AQ-5: the card as tall as its tallest screen, so the screens change what is in it, not its size.
  saga: {
    root: `${COMPACT.root ?? ""} relative min-h-[497px]`,
    messengerOption: "rounded-[var(--corner-control)] p-3.5 [&.border-primary]:bg-primary/8",
  },
  // AQ-6: two answers side by side, the picked one tinted.
  urgency: {
    messengerOption: "h-[42px] text-[14px] font-semibold data-[state=on]:bg-primary/8",
  },
};

/**
 * The card's classes in a `lead_channel` arm. `callInside`: the arm offers
 * the call itself (AQ-1/2/4/5), so the line under the card — "Pas envie de
 * taper ? Rappelez-moi" — is not drawn twice; Figma's boards have none.
 */
export function messengerParts(kind: MessengerKind, callInside: boolean): PartClassNames<LeadCapturePart> {
  return { ...MESSENGER, ...BY_KIND[kind], ...(callInside ? { others: "hidden" } : {}) };
}
