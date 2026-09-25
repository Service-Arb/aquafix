import { telHref } from "@evinvest/marketing";
import { Button } from "@evinvest/uikit";
import { NAV_IDS, NAV_SUFFIX, type Copy } from "@/entities/content";
import { contactOf, type PlaceView } from "@/entities/place";
import { perLocale } from "@/shared/config/i18n";
import { CTA_FACE, Lockup } from "@/shared/ui/brand";
import { BrandLangSwitch } from "@/shared/ui/BrandLangSwitch";
import { NavDrawer } from "./NavDrawer";

/**
 * The sub-pages' header; the drawer is `NavDrawer`, shared with the home
 * page's header. The phone is in the row at every width, on one line: below
 * `lg` the nav and the language switch go into the drawer, and the button
 * waits for `xl` — below it the drawer carries it, and from `lg` the proof
 * card's is on the same screen — so the row never runs past the viewport.
 */
export function PageHeader({ copy, point, suffix }: { copy: Copy; point: PlaceView; suffix: string }) {
  const { t, f } = copy;
  const { phone } = contactOf(point.place);
  const hrefs = perLocale(l => point.href(suffix, l));
  return (
    <header className="relative border-b border-border bg-background">
      <div className="flex items-center px-[var(--page-px)] py-2.5 md:py-[18px]">
        <a href={point.href("")} className="shrink-0" aria-label={`Aquafix ${f.place}`}>
          <Lockup
            mark="h-[26px] w-[22.5px] text-primary md:h-8 md:w-[27.7px]"
            word="text-[20px] text-brand md:text-[25px]"
          />
        </a>
        <div className="flex-1" />
        <nav className="hidden items-center gap-[30px] text-[15px] font-medium text-ink-mid lg:flex">
          {NAV_IDS.map(id => (
            <a key={id} href={point.href(NAV_SUFFIX[id])} className="hover:text-primary-ink">
              {t.nav[id]}
            </a>
          ))}
        </nav>
        <div className="hidden flex-1 lg:block" />
        <div className="ml-2 flex items-center gap-3 md:gap-5">
          <BrandLangSwitch
            label={copy.t.langLabel}
            current={copy.locale}
            hrefs={hrefs}
            className="hidden text-[13px] font-medium text-ink-mid lg:flex"
          />
          <a href={telHref(phone)} aria-label={`${t.headerPhoneLabel}, ${phone}`} className="flex flex-col">
            <span className="hidden text-[10px] font-medium tracking-[0.12em] text-ink-soft xl:block">{t.headerPhoneLabel}</span>
            <span className="whitespace-nowrap font-display text-[16px] font-bold text-ink max-[359px]:text-[13px] md:text-[20px] xl:text-[22px]">{phone}</span>
          </a>
          <Button
            href={point.href("#quote")}
            size="xl"
            data-intent="form_open"
            className={`hidden xl:inline-flex ${CTA_FACE}`}
          >
            {t.cta}
          </Button>
        </div>
        <NavDrawer copy={copy} point={point} className="ml-1 max-[359px]:ml-0 lg:hidden">
          <BrandLangSwitch
            label={copy.t.langLabel}
            current={copy.locale}
            hrefs={hrefs}
            className="py-2 text-[14px] font-medium text-ink-mid"
          />
          <Button href={point.href("#quote")} size="lg" data-intent="form_open" className={`my-2 w-full ${CTA_FACE}`}>
            {t.cta}
          </Button>
        </NavDrawer>
      </div>
    </header>
  );
}
