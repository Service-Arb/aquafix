import { telHref, whatsappHref } from "@evinvest/marketing";
import { Badge, Button } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import { contactOf, type PlaceView } from "@/entities/place";
import { QuoteForm } from "@/features/quote-form";
import { PHOTO_SETS } from "@/shared/assets/photos";
import { EYEBROW } from "@/shared/ui/BandHead";
import { CTA_FACE } from "@/shared/ui/brand";
import heroWide from "../../../../assets/photos/hero-wide.jpg";

/**
 * Tailwind's `md` is `min-width: 48rem`; this is its complement. Not the
 * range syntax `(width < 48rem)`: a `<source media>` in a browser without it
 * never matches, and would load the wide frame on a phone.
 */
const BELOW_MD = "(max-width: 47.99rem)";

/**
 * The one place the page's rule is visible as geometry: the photograph is the
 * only element that answers the viewport. The message and the form sit inside
 * the gutter, the same block of pixels at 1440 and at 2560.
 *
 * The quote form is here, beside the headline, rather than after the prices:
 * the owner's v2 design puts the one action on the first screen, so a visitor
 * standing in water does not have to scroll to reach it. The two other
 * channels sit under the headline — WhatsApp first, the phone after, as the
 * owner ranks them. `#quote` is the form card (kitstart's shell sets the id),
 * which every CTA points at.
 *
 * A hero crop, not the library shot: the master carries the depot signage
 * across its top third, which puts a second wordmark under the header.
 */
export function Hero({ copy, point, renderedAt }: { copy: Copy; point: PlaceView; renderedAt: number }) {
  const { t, f } = copy;
  const h = t.home;
  const { phone, whatsapp } = contactOf(point.place);
  return (
    <section className="dark relative isolate overflow-hidden">
      {/* The LCP element. Below `md` a crop of the region a phone can show, not
          the whole wide frame; AVIF, then WebP, then the jpg for the rest. */}
      <picture>
        <source media={BELOW_MD} type="image/avif" srcSet={PHOTO_SETS["hero-mobile"].avif} sizes="100vw" />
        <source media={BELOW_MD} type="image/webp" srcSet={PHOTO_SETS["hero-mobile"].webp} sizes="100vw" />
        <source type="image/avif" srcSet={PHOTO_SETS["hero-wide"].avif} sizes="100vw" />
        <source type="image/webp" srcSet={PHOTO_SETS["hero-wide"].webp} sizes="100vw" />
        <img
          src={heroWide.src}
          alt={t.heroPhotoAlt}
          fetchPriority="high"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[72%_50%] md:object-[60%_42%]"
        />
      </picture>
      <div className="hero-scrim absolute inset-0 -z-10" />
      <div className="flex w-full flex-col gap-8 px-[var(--page-px)] pb-10 pt-28 md:flex-row md:items-center md:gap-16 md:pb-[72px] md:pt-32">
        <div className="flex min-w-0 flex-1 flex-col">
          <p className={EYEBROW}>{h.eyebrow(f)}</p>
          <h1 className="mt-4 font-display text-[2.6rem] font-bold uppercase leading-[0.99] tracking-[-0.02em] text-ink md:mt-5 md:text-[4rem]">
            {h.display[0]}
            <br />
            <span className="text-primary">{h.display[1]}</span>
            <br />
            {h.display[2]}
          </h1>
          <p className="mt-5 text-[15.5px] leading-[1.6] text-ink-soft md:mt-6 md:text-[18px]">{h.lede(f)}</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4 md:mt-8">
            <Button
              href={whatsappHref(whatsapp, t.whatsappMessage(f))}
              size="xl"
              variant="outline"
              className={`border-ink-soft text-ink ${CTA_FACE}`}
            >
              {t.whatsappLabel}
            </Button>
            <a
              href={telHref(phone)}
              className="font-display text-[19px] font-bold leading-[normal] text-ink hover:text-primary-ink md:text-[21px]"
            >
              {phone}
            </a>
          </div>
          <ul className="mt-9 flex flex-wrap gap-2 md:mt-11">
            {[...t.statusStrip, h.decennaleBadge].map(label => (
              <li key={label}>
                <Badge variant="outline" className="rounded-sm bg-card text-[12px] text-ink">
                  {label}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full md:w-[460px] md:shrink-0">
          <QuoteForm copy={copy} point={point} renderedAt={renderedAt} />
        </div>
      </div>
    </section>
  );
}
