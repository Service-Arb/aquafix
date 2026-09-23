import { Section } from "@evinvest/uikit";
import type { StaticImageData } from "next/image";
import { WORK_IDS, type Copy, type WorkId } from "@/entities/content";
import { PHOTO_SETS, type PhotoStem } from "@/shared/assets/photos";
import { BandHead } from "@/shared/ui/BandHead";
import hotWater from "../../../../assets/photos/job-hot-water.jpg";
import pipeRepair from "../../../../assets/photos/job-pipe-repair.jpg";
import tapShower from "../../../../assets/photos/job-tap-shower.jpg";
import underSink from "../../../../assets/photos/job-under-sink.jpg";

/** A `Record` over the ids, so a photo without a caption does not compile. */
const PHOTOS: Record<WorkId, { jpg: StaticImageData; stem: PhotoStem }> = {
  drains: { jpg: underSink, stem: "job-under-sink" },
  taps: { jpg: tapShower, stem: "job-tap-shower" },
  heaters: { jpg: hotWater, stem: "job-hot-water" },
  pipes: { jpg: pipeRepair, stem: "job-pipe-repair" },
};

/** Half the viewport below `md`, a quarter of it from there. */
const THUMB_SIZES = "(width < 48rem) 50vw, 25vw";

function Photo({ id, alt, sizes, className }: { id: WorkId; alt: string; sizes: string; className: string }) {
  const { jpg, stem } = PHOTOS[id];
  // Lazy on both copies: the popover's sits in a closed (display: none)
  // popover, and only a lazy image waits for that to open.
  return (
    <picture>
      <source type="image/avif" srcSet={PHOTO_SETS[stem].avif} sizes={sizes} />
      <source type="image/webp" srcSet={PHOTO_SETS[stem].webp} sizes={sizes} />
      <img src={jpg.src} alt={alt} loading="lazy" decoding="async" className={className} />
    </picture>
  );
}

/**
 * Photographs with a label each, the detail behind a native `popover` rather
 * than in flow: a `<details>` that grew inside the grid reflowed the row and
 * stranded its neighbour. Open, dismiss and Escape are the platform's, so the
 * band costs no script; without support the button is inert, not broken.
 */
export function Work({ copy }: { copy: Copy }) {
  const h = copy.t.home;
  return (
    <Section id="work">
      <div className="flex flex-col gap-7 md:gap-10">
        <BandHead title={h.workTitle} />
        <ul className="grid grid-cols-2 items-start gap-3 md:grid-cols-4 md:gap-5">
          {WORK_IDS.map(id => {
            const { caption, body } = h.work[id];
            const popId = `work-${id}`;
            return (
              <li key={id} className="group flex flex-col gap-3">
                <button type="button" popoverTarget={popId} className="flex cursor-pointer flex-col gap-3 text-left">
                  <span className="overflow-hidden rounded-[var(--corner-card)] bg-muted">
                    {/* Square: four 4:3 frames inside the measure read as thumbnails. */}
                    <Photo
                      id={id}
                      alt={caption}
                      sizes={THUMB_SIZES}
                      className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </span>
                  <span className="text-[13px] font-medium text-ink md:text-[14.5px]">{caption}</span>
                  <span className="text-[12px] font-medium text-primary-ink md:text-[13px]">{h.workMore} →</span>
                </button>
                <div
                  id={popId}
                  popover="auto"
                  className="work-pop rounded-[var(--corner-card)] border border-border bg-background text-ink shadow-overlay"
                >
                  <Photo id={id} alt="" sizes="(width < 48rem) 100vw, 36rem" className="h-40 w-full rounded-[var(--corner-tile)] object-cover md:h-48" />
                  <h3 className="mt-5 font-display text-[21px] font-bold text-ink md:text-[26px]">{caption}</h3>
                  <p className="mt-3 text-[14.5px] leading-[1.65] text-ink-mid md:text-[16px]">{body}</p>
                  <button
                    type="button"
                    popoverTarget={popId}
                    popoverTargetAction="hide"
                    className="mt-6 self-start rounded-[var(--corner-control)] border border-border px-4 py-2 text-[13.5px] font-medium text-ink-mid hover:text-ink"
                  >
                    {h.workClose}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}
