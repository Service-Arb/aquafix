import { CallBar as KitCallBar, type CallBarPart, type PartClassNames } from "@evinvest/kitstart/react";
import type { CopyOf, Text } from "@/entities/content";
import { contactOf, type PlaceView } from "@/entities/place";
import { CTA_FACE } from "@/shared/ui/brand";

/**
 * kitstart's call bar, pinned to the bottom on a phone: the form and WhatsApp
 * lead, as the owner ranks the channels; the phone keeps a square of its own.
 */

/**
 * The kit's buttons keep their label on one line, so at 320 the three ran 22px
 * past the viewport. The two that share the row may shrink, and the longest
 * label wraps rather than push the bar out; from ~360 it fits on one line.
 */
const PARTS: PartClassNames<CallBarPart> = {
  whatsapp: "min-w-0",
  quote: "min-w-0 whitespace-normal leading-[1.15]",
};
export type CallBarCopy = CopyOf<Pick<Text, "callLabel" | "whatsappMessage" | "whatsappShort" | "ctaShort" | "callBarLabel">>;

export function CallBar({ copy, point }: { copy: CallBarCopy; point: PlaceView }) {
  const { phone, whatsapp } = contactOf(point.place);
  return (
    <KitCallBar
      id="callbar"
      copy={copy}
      phone={phone}
      whatsapp={whatsapp}
      quoteHref={point.href("#quote")}
      label={copy.t.callBarLabel}
      buttonClassName={CTA_FACE}
      classNames={PARTS}
    />
  );
}
