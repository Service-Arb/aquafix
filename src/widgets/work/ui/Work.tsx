import { Section } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import { BandHead } from "@/shared/ui/BandHead";
import { PriceTable } from "./PriceTable";
import { WorkTiles } from "./WorkTiles";

/**
 * What we do and what it costs, as one band: the tiles say which jobs, the
 * table puts a price on each. They were two bands until the v2 design joined
 * them under one head; the lede is the price list's own promise.
 */
export function Work({ copy }: { copy: Copy }) {
  const { t } = copy;
  const h = t.home;
  return (
    <Section tight id="work">
      <div className="flex flex-col gap-7 md:gap-8">
        <BandHead
          eyebrow={h.workEyebrow}
          title={h.workTitle}
          aside={
            <p className="text-[15px] leading-[1.5] text-ink-soft md:w-[420px] md:shrink-0 md:text-[16px]">{t.services.head.lede}</p>
          }
        />
        <WorkTiles h={h} />
        <PriceTable copy={copy} />
      </div>
    </Section>
  );
}
