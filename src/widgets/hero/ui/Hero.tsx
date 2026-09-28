import { Badge } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import type { PlaceView } from "@/entities/place";
import { QuoteForm } from "@/features/quote-form";
import { PHOTO_SETS } from "@/shared/assets/photos";
import { CONTROL, type Assignment } from "@/shared/config/experiments";
import { EYEBROW } from "@/shared/ui/BandHead";
import heroWide from "../../../../assets/photos/hero-wide.jpg";
import { HeroActions } from "./HeroActions";

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
 * which every CTA points at. Side by side only from `lg`: at 768 the form's
 * 460px left the headline a ~100px column, and the phone fell off the first
 * screen; between `md` and `lg` the form sits under the words instead.
 *
 * A hero crop, not the library shot: the master carries the depot signage
 * across its top third, which puts a second wordmark under the header.
 *
 * `variants` is the visitor's A/B assignment (docs/EXPERIMENTS.md); the
 * control is the page as described above.
 */
export function Hero({
  copy,
  point,
  renderedAt,
  variants = CONTROL,
}: {
  copy: Copy;
  point: PlaceView;
  renderedAt: number;
  variants?: Assignment;
}) {
  const { t, f } = copy;
  const h = t.home;
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
      <div className="flex w-full flex-col gap-8 px-[var(--page-px)] pb-10 pt-28 md:pb-[72px] md:pt-32 lg:flex-row lg:items-center lg:gap-16">
        <div className="flex min-w-0 flex-1 flex-col">
          <p className={EYEBROW}>{h.eyebrow(f)}</p>
          <h1 className="mt-4 font-display text-[clamp(2.6rem,4.4vw+0.5rem,4rem)] font-bold uppercase leading-[0.99] tracking-[-0.02em] text-ink md:mt-5">
            {h.display[0]}
            <br />
            <span className="text-primary">{h.display[1]}</span>
            <br />
            {h.display[2]}
          </h1>
          <p className="mt-5 text-[15.5px] leading-[1.6] text-ink-soft md:mt-6 md:text-[18px]">{h.lede(f)}</p>
          <HeroActions copy={copy} point={point} callFirst={variants.hero_call_first === "b"} />
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
        <div className="w-full md:max-w-[560px] lg:w-[460px] lg:shrink-0">
          <QuoteForm copy={copy} point={point} renderedAt={renderedAt} priceAnchor={variants.quote_price_anchor === "b"} />
        </div>
      </div>
    </section>
  );
}
