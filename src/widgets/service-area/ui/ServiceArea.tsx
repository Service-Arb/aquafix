import { AreaChips } from "@evinvest/kitstart/react";
import { Display, Eyebrow, Section } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import { servedLocalities, type PlaceView } from "@/entities/place";

/**
 * The refusal is the point: a window we cannot hit is worth nothing, so the
 * radius is published and everything past it is turned down.
 */

/** The Figma frame's chips over kitstart's: on the card plane, taller, the page's leading. */
const CHIPS = "flex-1 content-start gap-2.5";
const CHIP = "whitespace-nowrap bg-card py-2.5 text-[14px] leading-[inherit]";

export function ServiceArea({ copy, point }: { copy: Copy; point: PlaceView }) {
  const { t, f } = copy;
  const head = t.areaHead;
  return (
    <Section tight id="areas">
      <div className="flex flex-col gap-6 md:flex-row md:gap-14">
        <div className="flex flex-col gap-3 md:w-[500px] md:gap-3.5">
          <Eyebrow>{head.eyebrow}</Eyebrow>
          <Display>{head.title(f)}</Display>
          <p className="text-[15px] leading-[1.62] text-ink-soft md:text-[16.5px]">{head.lede}</p>
        </div>
        <AreaChips areas={servedLocalities(point.place)} className={CHIPS} chipClassName={CHIP} />
      </div>
    </Section>
  );
}
