import { telHref } from "@evinvest/marketing";
import { SERVICE_LIST, type Copy } from "@/entities/content";
import { contactOf, servedLocalities, storefrontOf, type PlaceView } from "@/entities/place";
import { site } from "@/shared/config/site";
import { Lockup } from "@/shared/ui/brand";
import type { ReactNode } from "react";

/** The sub-pages' footer. Local, not the kit's `Footer`: that one is EV-shaped. */
export function Footer({ copy, point }: { copy: Copy; point: PlaceView }) {
  const { t, f } = copy;
  const { phone } = contactOf(point.place);
  const front = storefrontOf(point.place);
  const cols = t.footer.columns;
  const company = t.footer.company;
  const areas = servedLocalities(point.place);
  return (
    <footer id="footer" className="dark bg-background px-[var(--page-px)] pt-9 md:pt-14">
      <div className="flex flex-col gap-8 md:flex-row md:gap-12">
        <div className="flex flex-col gap-4 md:w-80 md:gap-[18px]">
          <Lockup mark="h-[30px] w-[26px] text-primary" word="text-[23px] text-ink" />
          <p className="text-[11px] font-medium tracking-[0.16em] text-primary-ink">{t.promise}</p>
          <div className="flex flex-col gap-[7px] text-[13.5px] text-ink-soft">
            {t.footer.facts(f).map(fact => (
              <p key={fact}>{fact}</p>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 md:flex md:flex-1 md:gap-12">
          <Column heading={cols.services}>
            {SERVICE_LIST.slice(0, 7).map(s => (
              <a key={s.id} href={point.href("/prices")}>
                {t.services.items[s.id].name}
              </a>
            ))}
          </Column>
          <Column heading={cols.areas}>
            {areas.map(area => (
              <a key={area} href={point.href("/about#areas")}>
                {area}
              </a>
            ))}
          </Column>
          <Column heading={cols.company}>
            <a href={point.href("/guarantee")}>{company.guarantee}</a>
            <a href={point.href("/prices")}>{company.prices}</a>
            <a href={point.href("#reviews")}>{company.reviews}</a>
            <a href={point.href("/about#crew")}>{company.crew}</a>
            <a href={point.href("#quote")}>{company.contact}</a>
          </Column>
          <Column heading={cols.contact}>
            <a href={telHref(phone)} className="whitespace-nowrap font-display text-[22px] font-bold text-primary-ink">
              {phone}
            </a>
            <p>{t.emergencyHours}</p>
            <p>{t.bookingHours}</p>
            <a href={`mailto:${site.brand.email}`}>{site.brand.email}</a>
            {front && (
              <address className="not-italic">
                {front.address.street}, {front.address.postalCode} {front.address.locality}
              </address>
            )}
          </Column>
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-3 border-t border-border pb-7 pt-6 text-[13px] text-ink-soft md:mt-9 md:flex-row md:items-center md:gap-6">
        <p>
          © {site.brand.legalName} · {f.siret}
        </p>
        <div className="flex-1" />
        {t.footer.legal.map(label => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </footer>
  );
}

function Column({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-3.5">
      <p className="text-[11px] font-medium tracking-[0.16em] text-ink">{heading}</p>
      <div className="flex flex-col gap-[11px] text-[14.5px] text-ink-soft">{children}</div>
    </div>
  );
}
