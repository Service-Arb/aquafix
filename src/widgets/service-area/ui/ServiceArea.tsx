import { Badge, Display, Eyebrow, Section } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import { servedLocalities, type PlaceView } from "@/entities/place";

/**
 * The refusal is the point: a window we cannot hit is worth nothing, so the
 * radius is published and everything past it is turned down.
 */
export function ServiceArea({ copy, point }: { copy: Copy; point: PlaceView }) {
  const { t, f } = copy;
  const head = t.areaHead;
  const areas = servedLocalities(point.place);
  return (
    <Section tight id="areas">
      <div className="flex flex-col gap-6 md:flex-row md:gap-14">
        <div className="flex flex-col gap-3 md:w-[500px] md:gap-3.5">
          <Eyebrow>{head.eyebrow}</Eyebrow>
          <Display>{head.title(f)}</Display>
          <p className="text-[15px] leading-[1.62] text-ink-soft md:text-[16.5px]">{head.lede}</p>
        </div>
        <div className="flex flex-1 flex-wrap content-start gap-2.5">
          {areas.map(area => (
            // A small labelled chip at the wrong shape, so only the shape is overridden.
            <Badge key={area} variant="outline" className="rounded-full bg-card px-4 py-2.5 text-[14px] text-ink-mid">
              {area}
            </Badge>
          ))}
        </div>
      </div>
    </Section>
  );
}
