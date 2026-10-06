import { telHref } from "@evinvest/marketing";
import { AreaChips } from "@evinvest/kitstart/react";
import { Section } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import { addressOf, contactOf, hoursText, servedLocalities, storefrontOf, type PlaceView } from "@/entities/place";
import { BandHead } from "@/shared/ui/BandHead";

/**
 * A visitor's first question is whether you come to them at all, so the
 * communes get a band of their own: the chips, the point's address, hours and
 * phone. Until the owner names the zone, the chip list is the point's own town.
 *
 * No map: the visitor arrives from Google Maps and has already seen it, and
 * the owner found it did nothing for the call rate. Without it the heading
 * takes the left column from `lg` and the chips with the facts the right one,
 * so the band keeps the page's two-column grid instead of leaving half of it
 * empty; below `lg` it is one column, as before.
 */

/** The Figma frame's chips over kitstart's. */
const CHIP = "text-[13.5px] leading-[inherit] md:text-[14.5px]";

export function Coverage({ copy, point }: { copy: Copy; point: PlaceView }) {
  const { t, f, locale } = copy;
  const h = t.home;
  const { place } = point;
  const { phone } = contactOf(place);
  const front = storefrontOf(place);
  const address = addressOf(place);
  const hours = hoursText(place.hours, locale);
  const line = [address, hours].filter(Boolean).join(" · ");
  return (
    <Section tight id="areas">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-16">
        <div className="lg:w-[440px] lg:shrink-0">
          <BandHead eyebrow={h.coverageEyebrow(f)} title={h.coverageTitle} lede={h.coverageLede(f)} />
        </div>
        <div className="flex flex-col gap-6 lg:flex-1">
          <AreaChips areas={servedLocalities(place)} chipClassName={CHIP} />
          {front?.landmark && <p className="text-[14.5px] text-ink-soft">{front.landmark[locale]}</p>}
          <div className="flex flex-col gap-1.5 text-[15px]">
            {/* One line on a phone, three from `md`: the frame's two layouts. */}
            {line && <p className="text-ink md:hidden">{line}</p>}
            {address && <address className="hidden font-medium not-italic text-ink md:block">{address}</address>}
            {hours && <p className="hidden text-ink-soft md:block">{hours}</p>}
            <a href={telHref(phone)} className="hidden font-display text-[22px] font-bold text-primary-ink md:block">
              {phone}
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}
