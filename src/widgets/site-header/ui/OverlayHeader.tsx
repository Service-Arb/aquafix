import { telHref } from "@evinvest/marketing";
import { Button } from "@evinvest/uikit";
import { NAV_IDS, NAV_SUFFIX, type Copy } from "@/entities/content";
import { contactOf, type PlaceView } from "@/entities/place";
import { perLocale } from "@/shared/config/i18n";
import { CTA_FACE, Lockup } from "@/shared/ui/brand";
import { BrandLangSwitch } from "@/shared/ui/BrandLangSwitch";
import { NavDrawer } from "./NavDrawer";

/**
 * The home page's header: transparent and laid over the photograph, so the
 * hero owns the whole first screen. It scrolls away with the hero; the bottom
 * bar carries the contact channels on mobile from there. From `xl` — the
 * width the row fits in — it carries the phone as the sub-pages' header does,
 * and the rating beside it (the draft's, or Google's while fresh: `ShownRating`);
 * narrower, the hero's own phone link is on the same screen. The nav needs
 * `lg`: at 768 it pushed the button past the viewport, so between `md` and
 * `lg` it is in the sub-pages' drawer. A phone has the call bar instead.
 */
export function OverlayHeader({ copy, point }: { copy: Copy; point: PlaceView }) {
  const { t } = copy;
  const { phone } = contactOf(point.place);
  return (
    <header className="dark absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-background/75 to-transparent">
      <div className="flex items-center gap-8 px-[var(--page-px)] py-4 md:py-5">
        <a href={point.href("")} className="shrink-0" aria-label={`Aquafix ${copy.f.place}`}>
          <Lockup
            mark="h-[26px] w-[22.5px] text-primary md:h-7 md:w-[24px]"
            word="text-[20px] text-ink md:text-[23px]"
          />
        </a>
        <div className="flex-1" />
        <nav className="hidden items-center gap-8 text-[14.5px] font-medium text-ink-mid lg:flex">
          {NAV_IDS.map(id => (
            <a key={id} href={point.href(NAV_SUFFIX[id])} className="hover:text-primary-ink">
              {t.nav[id]}
            </a>
          ))}
        </nav>
        <BrandLangSwitch
          label={copy.t.langLabel}
          current={copy.locale}
          hrefs={perLocale(l => point.href("", l))}
          className="hidden text-[13px] font-medium text-ink-soft md:flex"
        />
        <p className="hidden whitespace-nowrap text-[14px] font-medium text-ink-mid xl:block">{t.home.headerRating(copy.f)}</p>
        <a href={telHref(phone)} aria-label={`${t.headerPhoneLabel}, ${phone}`} className="hidden flex-col leading-[normal] xl:flex">
          <span className="text-[10.5px] font-medium tracking-[0.08em] text-ink-soft">{t.headerPhoneLabel}</span>
          <span className="whitespace-nowrap font-display text-[18px] font-bold text-ink">{phone}</span>
        </a>
        <Button
          href={point.href("#quote")}
          size="lg"
          data-intent="form_open"
          className={`hidden md:inline-flex ${CTA_FACE}`}
        >
          {t.home.cta}
        </Button>
        <NavDrawer copy={copy} point={point} className="-ml-4 hidden md:block lg:hidden" />
      </div>
    </header>
  );
}
