import { CallBar as KitCallBar } from "@evinvest/kitstart/react";
import type { CopyOf, Text } from "@/entities/content";
import { contactOf, type PlaceView } from "@/entities/place";
import { CTA_FACE } from "@/shared/ui/brand";

/**
 * kitstart's call bar, pinned to the bottom on a phone: the form and WhatsApp
 * lead, as the owner ranks the channels; the phone keeps a square of its own.
 */
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
    />
  );
}
