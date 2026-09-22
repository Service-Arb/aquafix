import { telHref, whatsappHref } from "@evinvest/marketing";
import { Section } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import type { Point } from "@/entities/location";
import { QuoteForm } from "@/features/quote-form";

/**
 * The form lands here rather than in the hero: a visitor who has read the
 * prices is the one who fills a form in. The two other channels sit beside it
 * — WhatsApp first, the phone after, as the owner ranks them.
 */
export function Closing({ copy, point, renderedAt }: { copy: Copy; point: Point; renderedAt: number }) {
  const { t, f } = copy;
  const { location } = point;
  return (
    <Section polarity="dark" id="quote-band">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-14">
        <div className="flex flex-1 flex-col gap-4 md:gap-5 md:pt-2">
          <h2 className="font-display text-[28px] font-bold leading-[1.1] tracking-[-0.01em] text-ink md:text-[40px]">
            {t.home.closingTitle}
          </h2>
          <p className="text-[15.5px] leading-[1.6] text-ink-soft md:text-[17px]">{t.home.closingLede}</p>
          <a
            href={whatsappHref(location.whatsapp, t.whatsappMessage(f))}
            className="self-start font-display text-[17px] font-bold text-primary-ink underline-offset-4 hover:underline md:text-[19px]"
          >
            {t.whatsappLabel} →
          </a>
          <a href={telHref(location.phone)} className="font-display text-[22px] font-bold text-primary-ink md:text-[26px]">
            {location.phone}
          </a>
        </div>
        <div className="w-full md:max-w-[460px]">
          <QuoteForm copy={copy} point={point} renderedAt={renderedAt} />
        </div>
      </div>
    </Section>
  );
}
