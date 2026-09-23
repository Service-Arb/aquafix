import { telHref } from "@evinvest/marketing";
import { Button } from "@evinvest/uikit";
import { NAV_IDS, NAV_SUFFIX, type Copy } from "@/entities/content";
import { contactOf, type PlaceView } from "@/entities/place";
import { perLocale } from "@/shared/config/i18n";
import { CTA_FACE, Lockup } from "@/shared/ui/brand";
import { LangSwitch } from "@/shared/ui/LangSwitch";

/**
 * The sub-pages' header. The mobile drawer is a `<details>`: a nav that opens
 * without hydration is one less thing on the critical path.
 */
export function PageHeader({ copy, point, suffix }: { copy: Copy; point: PlaceView; suffix: string }) {
  const { t, f } = copy;
  const { phone } = contactOf(point.place);
  const hrefs = perLocale(l => point.href(suffix, l));
  return (
    <header className="relative border-b border-border bg-background">
      <div className="flex items-center px-[var(--page-px)] py-2.5 md:py-[18px]">
        <a href={point.href("")} className="shrink-0" aria-label={`Aquafix ${f.place}`}>
          <Lockup mark="h-[26px] w-[22.5px] text-primary md:h-8 md:w-[27.7px]" word="text-[20px] text-brand md:text-[25px]" />
        </a>
        <div className="flex-1" />
        <nav className="hidden items-center gap-[30px] text-[15px] font-medium text-ink-mid md:flex">
          {NAV_IDS.map(id => (
            <a key={id} href={point.href(NAV_SUFFIX[id])} className="hover:text-primary-ink">
              {t.nav[id]}
            </a>
          ))}
        </nav>
        <div className="hidden flex-1 md:block" />
        <div className="hidden items-center gap-5 md:flex">
          <LangSwitch current={copy.locale} hrefs={hrefs} className="text-[13px] font-medium text-ink-mid" />
          <a href={telHref(phone)} className="flex flex-col">
            <span className="text-[10px] font-medium tracking-[0.12em] text-ink-soft">{t.headerPhoneLabel}</span>
            <span className="font-display text-[22px] font-bold text-ink">{phone}</span>
          </a>
          <Button href={point.href("#quote")} size="xl" data-intent="form_open" className={CTA_FACE}>
            {t.cta}
          </Button>
        </div>
        <details className="md:hidden">
          <summary className="flex size-9 items-center justify-center text-[20px] text-ink" aria-label={t.menuLabel}>
            ☰
          </summary>
          <nav className="absolute inset-x-0 top-full z-20 flex flex-col gap-1 border-b border-border bg-background px-[var(--page-px)] py-3 text-[15px] font-medium text-ink-mid shadow-elevated">
            {NAV_IDS.map(id => (
              <a key={id} href={point.href(NAV_SUFFIX[id])} className="py-2">
                {t.nav[id]}
              </a>
            ))}
            <a href={telHref(phone)} className="py-2 font-display text-[18px] font-bold text-ink">
              {phone}
            </a>
            <LangSwitch current={copy.locale} hrefs={hrefs} className="py-2 text-[14px] font-medium text-ink-mid" />
          </nav>
        </details>
      </div>
    </header>
  );
}
