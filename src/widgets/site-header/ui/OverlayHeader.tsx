import { telHref } from "@evinvest/marketing";
import { Button } from "@evinvest/uikit";
import { NAV_IDS, NAV_SUFFIX, type Copy } from "@/entities/content";
import { contactOf, type PlaceView } from "@/entities/place";
import { perLocale } from "@/shared/config/i18n";
import { CTA_FACE, Lockup } from "@/shared/ui/brand";
import { BrandLangSwitch } from "@/shared/ui/BrandLangSwitch";
import { SURFACE_SCRIPT } from "../lib/surface";
import { HeaderSurface } from "./HeaderSurface";
import { MenuExtras } from "./MenuExtras";
import { NavDrawer } from "./NavDrawer";

/**
 * The home page's header: sticky, and laid over the photograph — the negative
 * margin gives back its height, so the hero still owns the whole first
 * screen. At the top it is the dark overlay on the photo; scrolled, or with
 * the menu open, it is the sub-pages' light bar (`SURFACE_SCRIPT` before
 * hydration, `HeaderSurface` after). The bar's height is the same in both,
 * `--header-h` in `globals.css`.
 *
 * From `xl` — the width the row fits in — it carries the phone as the
 * sub-pages' header does, and the rating beside it (the draft's, or Google's
 * while fresh: `ShownRating`). The nav needs `lg`: below it the links are in
 * the menu, which also carries the phone the row has no room for, and on a
 * phone the button and the language switch.
 */
export function OverlayHeader({ copy, point }: { copy: Copy; point: PlaceView }) {
  const { t } = copy;
  const { phone } = contactOf(point.place);
  const hrefs = perLocale(l => point.href("", l));
  return (
    <header
      data-site-header="home"
      className="group/hdr dark sticky top-0 z-40 -mb-(--header-h) h-(--header-h) border-b border-transparent bg-gradient-to-b from-background/75 to-transparent [&.light]:border-border [&.light]:bg-background [&.light]:bg-none"
    >
      {/* Before any other child: it runs as the header is parsed. */}
      <script dangerouslySetInnerHTML={{ __html: SURFACE_SCRIPT }} />
      <HeaderSurface />
      <div className="flex h-full items-center gap-3 px-[var(--page-px)] md:gap-8">
        <a href={point.href("")} className="shrink-0" aria-label={`Aquafix ${copy.f.place}`}>
          <Lockup
            mark="h-[26px] w-[22.5px] text-primary md:h-7 md:w-[24px]"
            word="text-[20px] text-ink group-[.light]/hdr:text-brand md:text-[23px]"
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
          hrefs={hrefs}
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
        <NavDrawer copy={copy} point={point} className="md:-ml-4 lg:hidden">
          <MenuExtras copy={copy} point={point} hrefs={hrefs} phone={phone} inRowFrom="md:hidden" />
        </NavDrawer>
      </div>
    </header>
  );
}
