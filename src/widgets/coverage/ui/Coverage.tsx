import { telHref } from "@evinvest/marketing";
import { AreaChips, MapFacade } from "@evinvest/kitstart/react";
import { Section } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import { contactOf, mapOf, servedLocalities, storefrontOf, type PlaceView } from "@/entities/place";
import { BandHead } from "@/shared/ui/BandHead";
import { MAP_FACE } from "@/shared/ui/map";

/**
 * A visitor's first question is whether you come to them at all, so the
 * communes get a band of their own: the chips, the point's address, hours and
 * phone, and for a storefront the map behind a click. Until the owner names
 * the zone, the chip list is the point's own town.
 *
 * kitstart's `AreaChips` and `MapFacade` laid out here rather than through its
 * `Coverage`, which stacks head, chips and map in one column and has no place
 * for the facts: the v2 frame puts the map in a column of its own.
 */

/** The Figma frame's chips over kitstart's; no slot yet: EV-invest/lib#156. */
const CHIPS = "[&>li]:text-[13.5px] [&>li]:leading-[inherit] md:[&>li]:text-[14.5px]";

export function Coverage({ copy, point }: { copy: Copy; point: PlaceView }) {
  const { t, f, locale } = copy;
  const h = t.home;
  const { place } = point;
  const { phone } = contactOf(place);
  const front = storefrontOf(place);
  const map = mapOf(place);
  return (
    <Section tight id="areas">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-16">
        <div className="flex flex-col gap-6 md:w-[440px] md:shrink-0">
          <BandHead eyebrow={h.coverageEyebrow(f)} title={h.coverageTitle} lede={h.coverageLede(f)} />
          <AreaChips areas={servedLocalities(place)} className={CHIPS} />
          {front?.landmark && <p className="text-[14.5px] text-ink-soft">{front.landmark[locale]}</p>}
          <div className="flex flex-col gap-1.5 text-[15px]">
            {/* One line on a phone, three from `md`: the frame's two layouts. */}
            <p className="text-ink md:hidden">{[map?.address, t.emergencyHours].filter(Boolean).join(" · ")}</p>
            {map && <address className="hidden font-medium not-italic text-ink md:block">{map.address}</address>}
            <p className="hidden text-ink-soft md:block">{t.emergencyHours}</p>
            <a href={telHref(phone)} className="hidden font-display text-[22px] font-bold text-primary-ink md:block">
              {phone}
            </a>
          </div>
        </div>
        {map && (
          <MapFacade
            query={map.query}
            title={h.mapTitle(f)}
            show={h.mapShow}
            address={map.address}
            className={`h-[180px] aspect-auto md:h-[380px] md:flex-1 md:aspect-auto ${MAP_FACE}`}
          />
        )}
      </div>
    </Section>
  );
}
