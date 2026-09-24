import { AreaChips, MapFacade } from "@evinvest/kitstart/react";
import { Display, Eyebrow, Section } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import { mapOf, servedLocalities, type PlaceView } from "@/entities/place";
import { MAP_FACE } from "@/shared/ui/map";

/**
 * The refusal is the point: a window we cannot hit is worth nothing, so the
 * radius is published and everything past it is turned down. The map is the
 * home page's facade, beside the words from `md`; the mobile frame has none.
 */

/** The Figma frame's chips over kitstart's: on the card plane, taller, the page's leading. */
const CHIPS =
  "content-start gap-2.5 [&>li]:whitespace-nowrap [&>li]:bg-card [&>li]:py-2.5 [&>li]:text-[14px] [&>li]:leading-[inherit]";

export function ServiceArea({ copy, point }: { copy: Copy; point: PlaceView }) {
  const { t, f } = copy;
  const head = t.areaHead;
  const map = mapOf(point.place);
  return (
    <Section tight id="areas">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-14">
        <div className="flex flex-col gap-3 md:w-[460px] md:shrink-0 md:gap-3.5">
          <Eyebrow>{head.eyebrow}</Eyebrow>
          <Display>{head.title(f)}</Display>
          <p className="text-[15px] leading-[1.62] text-ink-soft md:text-[16.5px]">{head.lede}</p>
          <AreaChips areas={servedLocalities(point.place)} className={CHIPS} />
        </div>
        {map && (
          <MapFacade
            query={map.query}
            title={t.home.mapTitle(f)}
            show={t.home.mapShow}
            address={map.address}
            className={`hidden md:block md:h-[360px] md:flex-1 md:aspect-auto ${MAP_FACE}`}
          />
        )}
      </div>
    </Section>
  );
}
