import { telHref } from "@evinvest/marketing";
import { Section } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import { contactOf, placeUrl, storefrontOf, type Place } from "@/entities/place";
import { BandHead } from "@/shared/ui/BandHead";

/**
 * The apex's one job: send the visitor to their point. Each card links to the
 * point's own subdomain — its canonical home — and carries its phone, so the
 * emergency visitor need not click through at all.
 */
export function LocationList({ copy, locations }: { copy: Copy; locations: readonly Place[] }) {
  const { t } = copy;
  return (
    <Section id="points">
      <div className="flex flex-col gap-7 md:gap-10">
        <BandHead title={t.brandPage.listTitle} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map(place => (
            <PlaceCard key={place.slug} copy={copy} place={place} />
          ))}
        </ul>
      </div>
    </Section>
  );
}

function PlaceCard({ copy, place }: { copy: Copy; place: Place }) {
  const { t, locale } = copy;
  const { phone } = contactOf(place);
  const front = storefrontOf(place);
  return (
    <li className="flex flex-col gap-3 rounded-[var(--corner-card)] border border-border bg-card p-6 md:p-7">
      <p className="font-display text-[20px] font-bold text-ink">{place.name[locale]}</p>
      {front && (
        <address className="text-[14.5px] not-italic leading-[1.55] text-ink-soft">
          {front.address.street}
          <br />
          {front.address.postalCode} {front.address.locality}
        </address>
      )}
      <a href={telHref(phone)} className="font-display text-[18px] font-bold text-primary-ink">
        {phone}
      </a>
      <a
        href={placeUrl(place.slug, locale, "")}
        className="mt-auto text-[14px] font-medium text-ink underline-offset-4 hover:underline"
      >
        {t.brandPage.open} →
      </a>
    </li>
  );
}
