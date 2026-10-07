import type { LeadCaptureText, MessengerFacts, MessengerKind, MessengerVariant } from "@evinvest/kitstart";
import type { LeadCaptureProps } from "@evinvest/kitstart/react";
import type { CopyOf, Text } from "@/entities/content";
import type { Assignment } from "@/shared/config/experiments";
import { URGENCY_FIELD } from "@/shared/config/lead";
import { ChannelGlyph } from "./ChannelGlyph";
import { AfterPhone } from "./FormLines";
import { MESSENGER_FALLBACK, messengerParts } from "./parts";

type MessengerFormCopy = CopyOf<Pick<Text, "quoteForm">>;

/** `lead_channel`'s arms (docs/EXPERIMENTS.md): `a` the control, `b`–`g` Figma's AQ-1…AQ-6. */
export type LeadChannelArm = Assignment["lead_channel"];

/** Each treatment arm's board, as kitstart's `LeadCapture` draws it. */
const VARIANTS: { readonly [A in Exclude<LeadChannelArm, "a">]: MessengerVariant } = {
  b: { kind: "select", side: "prefix" },
  c: { kind: "segment" },
  d: { kind: "thanks" },
  e: { kind: "swap" },
  f: { kind: "saga" },
  // Posted under the extra `lead_form` `c` already declares (`LEAD.extras`).
  g: { kind: "urgency", field: URGENCY_FIELD },
};

export const messengerVariantOf = (arm: LeadChannelArm): MessengerVariant | undefined => (arm === "a" ? undefined : VARIANTS[arm]);

/** The boards whose phone is for a call: the submit says so. */
const CALL_INSIDE: ReadonlySet<MessengerKind> = new Set(["select", "segment", "swap", "saga"]);

/** The brand's reference prefix: `AQ-7K3F`, in the message and the bot's `start`. */
export const REF_PREFIX = "AQ";

/**
 * What a `lead_channel` arm sets on the card over the compact one. `drawn`:
 * the place has WhatsApp, so the board is drawn — without it kitstart draws
 * the control (with the bot as a link, when there is one), and so does this:
 * the control's words, its line under the mobile, its callback line.
 */
export function messengerProps(
  copy: MessengerFormCopy,
  variant: MessengerVariant,
  facts: MessengerFacts,
  base: LeadCaptureText,
): Pick<LeadCaptureProps, "text" | "classNames" | "channelIcons"> & { afterPhone?: LeadCaptureProps["afterPhone"] } {
  const m = copy.t.quoteForm.messenger;
  const kind = variant.kind;
  const drawn = facts.whatsapp !== null;
  const callInside = drawn && CALL_INSIDE.has(kind);
  return {
    text: {
      ...base,
      ...m.text,
      ...(callInside ? { submit: m.callSubmit } : {}),
      ...(drawn ? m.byKind[kind] : {}),
      // AQ-5's message is the message alone: no line after it, which the kit leaves out when empty.
      ...(drawn && kind === "saga" ? { messengerPreviewNote: "" } : {}),
    },
    // Without WhatsApp kitstart draws the control (with the bot as a link, when there is one): the control's classes.
    classNames: drawn ? messengerParts(kind) : MESSENGER_FALLBACK,
    channelIcons: {
      whatsapp: <ChannelGlyph name="whatsapp" />,
      telegram: <ChannelGlyph name="telegram" />,
      // The boards' call (a segment, a picker item, «Être rappelé»); the
      // line under the card keeps its ask in `callback`, as the control's.
      phone: <ChannelGlyph name="phone" />,
      callback: copy.t.quoteForm.callbackAsk,
    },
    // No text message in this test: where the board asks the phone, it is for the call.
    ...(drawn && kind !== "thanks" ? { afterPhone: <AfterPhone line={m.callAfterPhone} /> } : {}),
  };
}
