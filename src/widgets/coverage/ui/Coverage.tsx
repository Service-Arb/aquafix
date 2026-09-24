import { Coverage as KitCoverage } from "@evinvest/kitstart/react";
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
const FRAME = [
  "[&_li]:text-[13.5px] md:[&_li]:text-[14.5px] [&_li]:leading-[inherit]",
  "[&>p]:text-[14.5px] [&>p]:leading-[inherit]",
  "[&_[data-state]]:rounded-[var(--corner-card)]",
  "[&_button>span:first-child]:text-[17px] md:[&_button>span:first-child]:text-[19px] [&_button>span:first-child]:leading-[inherit]",
  "[&_button>span:last-child]:text-[13.5px] md:[&_button>span:last-child]:text-[14.5px] [&_button>span:last-child]:leading-[inherit]",
].join(" ");

export function Coverage({ copy, point }: { copy: Copy; point: PlaceView }) {
  const { t, f, locale } = copy;
  return (
    <Section id="areas">
      <KitCoverage
        place={point.place}
        locale={locale}
        map={{ title: t.home.mapTitle(f), show: t.home.mapShow }}
        head={<BandHead title={t.home.coverageTitle} lede={t.home.coverageLede(f)} />}
        className={FRAME}
      />
    </Section>
  );
}
