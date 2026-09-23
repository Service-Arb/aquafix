import { telHref, whatsappHref } from "@evinvest/marketing";
import { Button } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import type { Point } from "@/entities/location";
import { PHOTO_SETS } from "@/shared/assets/photos";
import { CTA_FACE } from "@/shared/ui/brand";
import heroWide from "../../../../assets/photos/hero-wide.jpg";

/** Tailwind's `md` is `min-width: 48rem`; this is its complement. */
const BELOW_MD = "(width < 48rem)";

/**
 * The one place the page's rule is visible as geometry: the photograph is the
 * only element that answers the viewport. The message sits in a fixed measure
 * pinned to the gutter, the same block of pixels at 1440 and at 2560.
 *
 * A hero crop, not the library shot: the master carries the depot signage
 * across its top third, which puts a second wordmark under the header.
 */
export function Hero({ copy, point }: { copy: Copy; point: Point }) {
  const { t, f } = copy;
  const h = t.home;
  const { location } = point;
  return (
    <section className="dark relative isolate flex min-h-[580px] flex-col justify-end overflow-hidden md:min-h-[76vh] md:justify-center">
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
      <div className="w-full px-[var(--page-px)] pb-12 pt-28 md:pb-20 md:pt-32">
        <div className="flex max-w-[var(--measure)] flex-col">
          <p className="text-[10.5px] font-semibold tracking-[0.16em] text-primary-ink md:text-[12px]">{h.eyebrow(f)}</p>
          <h1 className="mt-4 font-display text-[clamp(2.6rem,9vw,4.75rem)] font-bold uppercase leading-[0.99] tracking-[-0.02em] text-ink md:mt-5">
            {h.display[0]}
            <br />
            <span className="text-primary">{h.display[1]}</span>
            <br />
            {h.display[2]}
          </h1>
          <p className="mt-5 text-[15.5px] leading-[1.6] text-ink-soft md:mt-6 md:text-[18px]">{h.lede(f)}</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4 md:mt-8">
            <Button href={point.href("#quote")} size="xl" data-intent="form_open" className={CTA_FACE}>
              {h.cta}
            </Button>
            <Button
              href={whatsappHref(location.whatsapp, t.whatsappMessage(f))}
              size="xl"
              variant="outline"
              className={`border-ink-soft text-ink ${CTA_FACE}`}
            >
              {t.whatsappLabel}
            </Button>
            <a
              href={telHref(location.phone)}
              className="font-display text-[19px] font-bold text-ink hover:text-primary-ink md:text-[21px]"
            >
              {location.phone}
            </a>
          </div>
          {/* Four figures under a rule say what the proof band said, inside the measure. */}
          <div className="mt-9 border-t border-ink/20 pt-6 md:mt-11">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 md:flex md:flex-wrap md:gap-x-10">
              {h.stats.map(s => (
                <div key={s.label} className="flex flex-col-reverse gap-1">
                  <dt className="text-[10px] font-medium tracking-[0.1em] text-ink-soft md:text-[10.5px]">{s.label}</dt>
                  <dd className="font-display font-num text-[21px] font-bold text-ink md:text-[25px]">{s.figure}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
