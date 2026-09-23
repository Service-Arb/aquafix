import { telHref, whatsappHref } from "@evinvest/marketing";
import { Button } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import { contactOf, type PlaceView } from "@/entities/place";
import { CTA_FACE } from "@/shared/ui/brand";

/**
 * Pinned to the bottom, mobile only. The header scrolls away with the hero,
 * so without this there is no contact channel on a phone between the hero and
 * the closing band. `sticky`, not `fixed`: it is the last thing in the flow,
 * so it reserves its own height instead of the page guessing it back.
 *
 * The form and WhatsApp lead, as the owner ranks the channels; the phone keeps
 * a square of its own, because the visitor standing in water still calls.
 */
export function CallBar({ copy, point }: { copy: Copy; point: PlaceView }) {
  const { t, f } = copy;
  const { phone, whatsapp } = contactOf(point.place);
  return (
    <div
      id="callbar"
      className="sticky bottom-0 z-30 flex gap-2 border-t border-border bg-background px-3 py-2.5 shadow-overlay md:hidden"
    >
      <Button
        href={telHref(phone)}
        size="xl"
        variant="outline"
        aria-label={t.callLabel(f)}
        className={`shrink-0 px-4 ${CTA_FACE}`}
      >
        ☎
      </Button>
      <Button
        href={whatsappHref(whatsapp, t.whatsappMessage(f))}
        size="xl"
        variant="outline"
        className={`flex-1 px-3 ${CTA_FACE}`}
      >
        {t.whatsappShort}
      </Button>
      <Button href={point.href("#quote")} size="xl" data-intent="form_open" className={`flex-1 px-3 ${CTA_FACE}`}>
        {t.ctaShort}
      </Button>
    </div>
  );
}
