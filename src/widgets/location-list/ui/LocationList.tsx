import { PlaceDirectory, type PlaceDirectoryPart } from "@evinvest/kitstart/react";
import { Section } from "@evinvest/uikit";
import type { BrandPageCopy, CopyOf } from "@/entities/content";
import { contactOf, placeUrl, type Place } from "@/entities/place";
import { BandHead } from "@/shared/ui/BandHead";

/**
 * The apex's one job: send the visitor to their point — kitstart's directory,
 * each card linking to the point's own subdomain and carrying its phone.
 */
export type LocationListCopy = CopyOf<{ brandPage: Pick<BrandPageCopy, "listTitle" | "open"> }>;

/**
 * The Figma frame's geometry over kitstart's type scale: the card corner is
 * the brand's, the one-line parts set solid (the frame's `normal` leading),
 * the address at its own size and leading.
 */
const CARDS: Partial<Record<PlaceDirectoryPart, string>> = {
  card: "rounded-[var(--corner-card)]",
  name: "leading-[normal]",
  address: "text-[14.5px] leading-[1.55]",
  phone: "leading-[normal]",
  link: "leading-[normal]",
};

export function LocationList({ copy, locations }: { copy: LocationListCopy; locations: readonly Place[] }) {
  const { t, locale } = copy;
  return (
    <Section tight id="points">
      <PlaceDirectory
        id="points-list"
        places={locations}
        locale={locale}
        hrefOf={place => placeUrl(place.slug, locale, "")}
        phoneOf={place => contactOf(place).phone}
        openLabel={t.brandPage.open}
        head={<BandHead title={t.brandPage.listTitle} />}
        classNames={CARDS}
      />
    </Section>
  );
}
