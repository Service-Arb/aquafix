import { telHref } from "@evinvest/marketing";
import { Button, Section } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import { contactOf, type PlaceView } from "@/entities/place";
import { BandHead } from "@/shared/ui/BandHead";
import { CTA_FACE } from "@/shared/ui/brand";

/**
 * Three reviews, one of them four stars on purpose: a perfect wall reads as
 * filtered. TODO(owner): these are the draft's placeholders; the live source
 * is meant to mirror Google's own reviews here, never to author new ones —
 * and the Figma's «Lire tous les avis sur Google» waits for a per-point
 * reviews URL (`OWNER_TODO`). The rating line calls itself Google's only when
 * it is (`ShownRating.google`).
 *
 * The action row is desktop only: on a phone the call bar is already there.
 */
export function Reviews({ copy, point }: { copy: Copy; point: PlaceView }) {
  const { t, f } = copy;
  const h = t.home;
  const { phone } = contactOf(point.place);
  const [before, after] = h.reviewsCallAside;
  return (
    <Section surface="card" tight id="reviews">
      <div className="flex flex-col gap-7 md:gap-9">
        <BandHead
          eyebrow={h.reviewsEyebrow}
          title={h.reviewsTitle}
          lede={
            <p className="flex items-center gap-2.5 text-[14.5px] font-medium leading-[normal] text-ink-mid md:text-[15px]">
              <span aria-hidden="true" className="tracking-[0.1em]">
                {"★".repeat(f.rating.stars)}
              </span>
              {h.reviewsRating(f)}
            </p>
          }
        />
        <div className="flex flex-col gap-5 md:flex-row md:gap-6">
          {t.reviews.map(review => (
            <figure
              key={review.author}
              className="flex flex-1 flex-col gap-3.5 rounded-[var(--corner-card)] border border-border bg-background p-6 md:p-7"
            >
              <p className="text-[13px] tracking-[0.18em] text-primary-ink" aria-label={`${review.stars}/5`}>
                {"★".repeat(review.stars)}
              </p>
              <blockquote className="text-[14.5px] leading-[1.6] text-ink-mid md:text-[15.5px]">{review.body(f)}</blockquote>
              <figcaption className="mt-auto text-[13px] font-semibold text-ink">
                {review.author}
                <span className="font-normal text-ink-soft"> · {review.attrib}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="hidden items-center justify-center gap-5 md:flex">
          <Button href={point.href("#quote")} size="lg" data-intent="form_open" className={CTA_FACE}>
            {t.cta}
          </Button>
          <p className="text-[15px] text-ink-soft">
            {before}
            <a href={telHref(phone)} className="hover:text-primary-ink">
              {phone}
            </a>
            {after}
          </p>
        </div>
      </div>
    </Section>
  );
}
