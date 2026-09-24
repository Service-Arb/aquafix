import { Coverage as KitCoverage, type CoveragePart } from "@evinvest/kitstart/react";
import { Section } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import type { PlaceView } from "@/entities/place";
import { BandHead } from "@/shared/ui/BandHead";

/**
 * A visitor's first question is whether you come to them at all, so the
 * communes get a band of their own: kitstart's coverage — the chips, and for
 * a storefront its landmark and the map behind a click. Until the owner names
 * the zone, the chip list is the point's own town.
 */

/**
 * The Figma frame's geometry over kitstart's type scale: the chips' and the
 * landmark's sizes, the map's corner and its call to action.
 */
const FRAME: Partial<Record<CoveragePart, string>> = {
  chip: "text-[13.5px] leading-[inherit] md:text-[14.5px]",
  landmark: "text-[14.5px] leading-[inherit]",
  map: "rounded-[var(--corner-card)]",
  mapShow: "text-[17px] leading-[inherit] md:text-[19px]",
  mapAddress: "text-[13.5px] leading-[inherit] md:text-[14.5px]",
};

export function Coverage({ copy, point }: { copy: Copy; point: PlaceView }) {
  const { t, f, locale } = copy;
  return (
    <Section id="areas">
      <KitCoverage
        place={point.place}
        locale={locale}
        map={{ title: t.home.mapTitle(f), show: t.home.mapShow }}
        head={<BandHead title={t.home.coverageTitle} lede={t.home.coverageLede(f)} />}
        classNames={FRAME}
      />
    </Section>
  );
}
