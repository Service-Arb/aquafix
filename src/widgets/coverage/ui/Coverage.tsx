import { Section } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import type { Point } from "@/entities/location";
import { MapFacade } from "@/features/map-facade";
import { BandHead } from "@/shared/ui/BandHead";

/**
 * A visitor's first question is whether you come to them at all, so the
 * communes get a band of their own. Until the owner names the zone, the chip
 * list is the point's own town — and the point stays unpublished.
 */
export function Coverage({ copy, point }: { copy: Copy; point: Point }) {
  const { t, f, locale } = copy;
  const { location } = point;
  const areas = location.serviceArea ?? [location.address.locality];
  const address = `${location.address.street}, ${location.address.postalCode} ${location.address.locality}`;
  return (
    <Section id="areas">
      <div className="flex flex-col gap-6 md:gap-8">
        <BandHead title={t.home.coverageTitle} lede={t.home.coverageLede(f)} />
        <ul className="flex flex-wrap gap-2 md:gap-2.5">
          {areas.map(area => (
            <li
              key={area}
              className="rounded-full border border-border bg-muted px-4 py-2 text-[13.5px] font-medium text-ink-mid md:text-[14.5px]"
            >
              {area}
            </li>
          ))}
        </ul>
        {location.landmark && <p className="text-[14.5px] text-ink-soft">{location.landmark[locale]}</p>}
        <MapFacade query={`${location.gbpName}, ${address}`} title={t.home.mapTitle(f)} show={t.home.mapShow} address={address} />
      </div>
    </Section>
  );
}
