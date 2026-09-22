import { Section } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import { BandHead } from "@/shared/ui/BandHead";

/**
 * Three reviews, one of them four stars on purpose: a perfect wall reads as
 * filtered. TODO(owner): these are the draft's placeholders; the live source
 * is meant to mirror Google's own reviews here, never to author new ones.
 */
export function Reviews({ copy }: { copy: Copy }) {
  const { t, f } = copy;
  return (
    <Section surface="card" id="reviews">
      <div className="flex flex-col gap-7 md:gap-10">
        <BandHead title={t.home.reviewsTitle} />
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
      </div>
    </Section>
  );
}
