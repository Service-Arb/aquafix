import { LEAD_CAPTURE_TEXT } from "@evinvest/kitstart";
import { CallBar as KitCallBar, type CallBarPart, type PartClassNames } from "@evinvest/kitstart/react";
import type { CopyOf, Text } from "@/entities/content";
import { contactOf, type PlaceView } from "@/entities/place";
import { CTA_FACE } from "@/shared/ui/brand";

/**
 * kitstart's call bar, pinned to the bottom on a phone: the form and WhatsApp
 * lead, as the owner ranks the channels; the phone keeps a square of its own.
 * With the point's hours the kit orders the buttons as `LeadCapture` orders
 * its channels — open, the call first; closed, "call me back" filled and the
 * call last. No point has hours yet, and without them the bar keeps today's
 * three buttons in today's order: the callback joins only with real hours,
 * never on a guess.
 */

/**
 * The kit's buttons keep their label on one line, so at 320 the three ran 22px
 * past the viewport. Below 360 the two that share the row may shrink, and the
 * longest label wraps rather than push the bar out. Only there: `flex-1` is a
 * zero basis, so a shrinkable button would split the row evenly and wrap its
 * label at 390 too, where it fits on one line.
 */
const PARTS: PartClassNames<CallBarPart> = {
  whatsapp: "max-[359px]:min-w-0",
  callback: "max-[359px]:min-w-0 max-[359px]:whitespace-normal max-[359px]:leading-[1.15]",
  quote: "max-[359px]:min-w-0 max-[359px]:whitespace-normal max-[359px]:leading-[1.15]",
};
export type CallBarCopy = CopyOf<Pick<Text, "callLabel" | "whatsappMessage" | "whatsappShort" | "ctaShort" | "callBarLabel">>;

export function CallBar({ copy, point, renderedAt }: { copy: CallBarCopy; point: PlaceView; renderedAt: number }) {
  const { phone, whatsapp } = contactOf(point.place);
  const { hours } = point.place;
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
      hours={hours}
      now={renderedAt}
      // The callback form's id: `LeadCapture`'s `<id>-callback`.
      {...(hours ? { callback: { href: point.href("#quote-callback"), label: LEAD_CAPTURE_TEXT[copy.locale].callback } } : {})}
    />
  );
}
