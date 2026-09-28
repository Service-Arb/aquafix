import { telHref, whatsappHref } from "@evinvest/marketing";
import { Button } from "@evinvest/uikit";
import type { CopyOf, Text } from "@/entities/content";
import { contactOf, type PlaceView } from "@/entities/place";
import { CTA_FACE } from "@/shared/ui/brand";

export type HeroActionsCopy = CopyOf<Pick<Text, "home" | "whatsappLabel" | "whatsappMessage">>;

/**
 * The hero's contact row: WhatsApp first, the phone after, as the owner ranks
 * them. `callFirst` is the `hero_call_first` treatment (docs/EXPERIMENTS.md):
 * below `md` the phone becomes the full-width primary action — most plumbing
 * jobs are booked by a call, and a phone visitor has the problem now — with
 * WhatsApp second and the form behind a link. From `md` up it is the control.
 */
export function HeroActions({ copy, point, callFirst }: { copy: HeroActionsCopy; point: PlaceView; callFirst: boolean }) {
  const { t, f } = copy;
  const { phone, whatsapp } = contactOf(point.place);
  const whatsappButton = (className: string) => (
    <Button href={whatsappHref(whatsapp, t.whatsappMessage(f))} size="xl" variant="outline" className={`border-ink-soft text-ink ${CTA_FACE} ${className}`}>
      {t.whatsappLabel}
    </Button>
  );
  return (
    <>
      <div className={`mt-7 flex-wrap items-center gap-x-6 gap-y-4 md:mt-8 ${callFirst ? "hidden md:flex" : "flex"}`}>
        {whatsappButton("")}
        <a
          href={telHref(phone)}
          className="font-display text-[19px] font-bold leading-[normal] text-ink hover:text-primary-ink md:text-[21px]"
        >
          {phone}
        </a>
      </div>
      {callFirst && (
        <div className="mt-7 flex flex-col gap-3 md:hidden">
          <Button href={telHref(phone)} size="xl" className={`h-auto w-full flex-col gap-0.5 py-3 ${CTA_FACE}`}>
            <span>{t.home.callFirst.call}</span>
            <span className="text-[19px] font-bold leading-[normal]">{phone}</span>
          </Button>
          {whatsappButton("w-full")}
          <a
            href={point.href("#quote")}
            data-intent="form_open"
            className="self-center py-2 text-[15px] font-medium text-ink underline underline-offset-4 hover:text-primary-ink"
          >
            {t.home.callFirst.writtenQuote}
          </a>
        </div>
      )}
    </>
  );
}
