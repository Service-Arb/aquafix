import { Button } from "@evinvest/uikit";
import { NAV_IDS, NAV_SUFFIX, type Copy } from "@/entities/content";
import type { PlaceView } from "@/entities/place";
import { perLocale } from "@/shared/config/i18n";
import { CTA_FACE, Lockup } from "@/shared/ui/brand";
import { BrandLangSwitch } from "@/shared/ui/BrandLangSwitch";

/**
 * The home page's header: transparent and laid over the photograph, so the
 * hero owns the whole first screen. It scrolls away with the hero; the bottom
 * bar carries the contact channels on mobile from there.
 */
export function OverlayHeader({ copy, point }: { copy: Copy; point: PlaceView }) {
  const { t } = copy;
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
        <nav className="hidden items-center gap-8 text-[14.5px] font-medium text-ink-mid md:flex">
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
        <Button
          href={point.href("#quote")}
          size="lg"
          data-intent="form_open"
          className={`hidden md:inline-flex ${CTA_FACE}`}
        >
          {t.home.cta}
        </Button>
      </div>
    </header>
  );
}
