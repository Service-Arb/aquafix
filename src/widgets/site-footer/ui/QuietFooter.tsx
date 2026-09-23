import { telHref } from "@evinvest/marketing";
import { NAV_IDS, NAV_SUFFIX, type Copy } from "@/entities/content";
import type { Point } from "@/entities/location";
import { perLocale } from "@/shared/config/i18n";
import { Lockup } from "@/shared/ui/brand";
import { LangSwitch } from "@/shared/ui/LangSwitch";

/**
 * One row of facts and one row of law. The four-column link farm went with the
 * banded page it belonged to — every page it linked to is in the header.
 */
export function QuietFooter({ copy, point }: { copy: Copy; point: Point }) {
  const { t, f } = copy;
  const { location } = point;
  return (
    <footer id="footer" className="border-t border-border bg-background px-[var(--page-px)] py-10 md:py-14">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-3">
            <Lockup mark="h-7 w-[24px] text-primary" word="text-[23px] text-brand" />
            <a href={telHref(location.phone)} className="font-display text-[22px] font-bold text-primary-ink">
              {location.phone}
            </a>
            <p className="text-[14px] text-ink-soft">{t.emergencyHours}</p>
            <address className="text-[14px] not-italic text-ink-soft">
              {location.address.street}, {location.address.postalCode} {location.address.locality}
            </address>
          </div>
          <nav className="flex flex-wrap gap-x-7 gap-y-2 text-[14.5px] font-medium text-ink-mid">
            {NAV_IDS.map(id => (
              <a key={id} href={point.href(NAV_SUFFIX[id])} className="hover:text-primary-ink">
                {t.nav[id]}
              </a>
            ))}
            <a href="#" className="hover:text-primary-ink">
              {t.home.backToTop}
            </a>
          </nav>
        </div>
        <div className="flex flex-col gap-3 border-t border-border pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-[12.5px] text-ink-soft">{[...t.footer.facts(f), ...t.footer.legal].join(" · ")}</p>
          <LangSwitch
            current={copy.locale}
            hrefs={perLocale(l => point.href("", l))}
            className="text-[12.5px] font-medium text-ink-soft"
          />
        </div>
      </div>
    </footer>
  );
}
