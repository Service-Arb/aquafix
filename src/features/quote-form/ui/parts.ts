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
 * Every main button of a `lead_channel` arm — the messenger's link
 * (`messengerCta`) and the submit, inside the board or the control's — one
 * height, Figma's 48px: a state that swaps one for the other must not move
 * the card. The brand's CTA face and padding, a fixed box instead of the
 * control's vertical padding. The kit hands the submit inside a board the
 * phone glyph (`channelIcons.phone`); the call's button in Figma has none, so
 * on a `<button>` it is hidden — a messenger's link keeps its mark.
 */
const CTA_48 = `h-12 min-h-0 px-[var(--control-px)] py-0 text-[length:var(--control-text)] leading-6 [button&>span[aria-hidden]]:hidden ${CTA_FACE}`;

/**
 * The ticked small print under a field, as `AfterPhone` draws it — on the
 * select's hint (a `<p>`), not on the in-app one. Two lines tall whatever it
 * says: WhatsApp's hint takes two at 390, Telegram's one.
 */
const MESSENGER_HINT =
  "text-[13px] font-medium leading-4 text-ink-mid [p&]:-mt-1 [p&]:flex [p&]:h-8 [p&]:gap-2 [p&]:before:font-semibold [p&]:before:text-positive [p&]:before:content-['✓']";

/**
 * On a computer a WhatsApp tap draws the QR code in the slot (kitstart's
 * `QrPanel`, its code an `svg[role=img]`): taller than any phone state, so
 * the slot gives up its fixed height for it and the card grows, as Figma's
 * desktop frames do (AQ-3 PC). Every other state keeps the fixed box — on a
 * phone there is no QR state, and the boards' heights are unchanged.
 */
const QR_GROWS = "has-[svg[role=img]]:h-auto";

/** The channel's slot: the phone and its line, or the message ready — 92px, but for the QR code. */
const SLOT_92 = `h-[92px] ${QR_GROWS}`;

/** The kit's «Message envoyé ?» screen over the card, padded and rounded as the card is. */
const RETURN = "rounded-[var(--corner-float)] px-6 py-7 md:px-[34px] md:pb-[30px] md:pt-8";

/**
 * `lead_channel`'s parts over the compact card (Figma, Aquafix "Lead form
 * A/B", the messengers v3 section): every state of an arm one height — the
 * channel's slot 92px (the phone and its line, or the message ready),
 * `swap`'s 52px (the WhatsApp button, or the phone), every main button 48px.
 * `relative` holds the kit's «Message envoyé ?» screen over the card, padded
 * as the card is.
 */
const MESSENGER: PartClassNames<LeadCapturePart> = {
  ...COMPACT,
  root: `${COMPACT.root ?? ""} relative`,
  submit: CTA_48,
  messengerCta: CTA_48,
  // Under a board the kit's trust box holds only the no-script fallback (a
  // `<noscript>`, drawn by no browser that runs the board): out of the
  // column, or its gap is 12px more card than Figma's.
  trust: "[&:not(:has(>:not(noscript)))]:hidden",
  messengerSecondary: CTA_FACE,
  messengerSlot: SLOT_92,
  messengerPreview: "h-full items-center gap-3 rounded-[var(--corner-control)] bg-primary/8 px-4 py-3",
  messengerHint: MESSENGER_HINT,
  messengerQr: "rounded-[var(--corner-control)]",
  messengerReturn: RETURN,
};

/**
 * «ou via Telegram» under the button: a line of orange text in a 24px box —
 * the least a tap target may be (WCAG 2.5.8), Figma's text is 17px — not the
 * kit's 44px link box, which would make the board taller than its frame. The
 * boards that draw it have no other secondary button in the card (the return
 * screen's «Rouvrir WhatsApp» is drawn over it).
 */
const VIA_TELEGRAM = `h-6 min-h-0 py-0 text-[14px] leading-[17px] text-primary-ink ${CTA_FACE}`;

/** What one board sets over {@link MESSENGER}. */
const BY_KIND: { readonly [K in MessengerKind]?: PartClassNames<LeadCapturePart> } = {
  // AQ-1: the picker is the phone field's frame, 52px as every field.
  select: { messengerPicker: "h-[52px]" },
  // AQ-2: «WhatsApp | Appel» on a muted track, the picked one lifted; «ou via Telegram» a line of text.
  segment: {
    messengerSecondary: VIA_TELEGRAM,
    messengerPicker: "h-12 rounded-[var(--corner-control)] bg-muted p-1",
    messengerOption: "h-10 text-[15px] font-medium text-ink-soft data-[state=on]:bg-card data-[state=on]:shadow-sm",
  },
  // AQ-4: slot A is the WhatsApp button or the phone, 52px; row B under it.
  swap: {
    messengerSlot: `h-[52px] [&>a]:h-full ${QR_GROWS}`,
    messengerSecondary: `h-[49px] min-h-0 ${CTA_FACE}`,
    messengerSquare: "size-[49px] min-h-0 rounded-[var(--corner-control)]",
  },
  // AQ-3: the success's Telegram button as tall as the photo's.
  thanks: { messengerSecondary: CTA_48 },
  // AQ-5: the card as tall as its tallest screen, so the screens change what is in it, not its size.
  saga: {
    // Figma draws it 449px (its 497px frame less 48px of margin); the channel screen measures 454px at 390 here, the tallest.
    root: `${COMPACT.root ?? ""} relative min-h-[454px]`,
    messengerOption: "rounded-[var(--corner-control)] p-3 [&.border-primary]:bg-primary/8",
  },
  // AQ-6: two answers side by side, the picked one tinted; «ou via Telegram» a line of text.
  urgency: {
    messengerSecondary: VIA_TELEGRAM,
    messengerOption: "h-[42px] text-[14px] font-semibold data-[state=on]:bg-primary/8",
  },
};

/**
 * A `lead_channel` arm at a place with the bot and no WhatsApp: kitstart
 * draws the control and «ou via Telegram» under its submit (Figma's
 * fallback) — the control's card, the link as the boards draw it.
 */
export const MESSENGER_FALLBACK: PartClassNames<LeadCapturePart> = {
  ...COMPACT,
  root: `${COMPACT.root ?? ""} relative`,
  messengerSecondary: VIA_TELEGRAM,
  messengerReturn: RETURN,
};

/**
 * The card's classes in a `lead_channel` arm whose board is drawn. The line
 * under the card — "Pas envie de taper ? Rappelez-moi" — is not: every board
 * offers the call itself, and Figma's frames (the boards, and the control
 * beside them) have none.
 */
export function messengerParts(kind: MessengerKind): PartClassNames<LeadCapturePart> {
  return { ...MESSENGER, ...BY_KIND[kind], others: "hidden" };
}
