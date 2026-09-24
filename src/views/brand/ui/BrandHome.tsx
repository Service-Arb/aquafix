import { telHref } from "@evinvest/marketing";
import { Section } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import type { Place } from "@/entities/place";
import { CARD, site } from "@/shared/config/site";
import { perLocale } from "@/shared/config/i18n";
import { Lockup } from "@/shared/ui/brand";
import { LocationList } from "@/widgets/location-list";
import { ProofAside } from "@/widgets/proof-aside";
import { BrandLangSwitch } from "@/shared/ui/BrandLangSwitch";

/**
 * The apex, `aquafix.top`: the brand and its points, nothing to convert on
 * here — every conversion belongs to a point, which has the phone and the van.
 */
export function BrandHome({ copy, locations }: { copy: Copy; locations: readonly Place[] }) {
  const { t } = copy;
  return (
    <>
      <header className="dark flex items-center bg-background px-[var(--page-px)] py-4 md:py-5">
        <Lockup mark="h-7 w-[24px] text-primary" word="text-[23px] text-ink" />
        <div className="flex-1" />
        <BrandLangSwitch
          label={copy.t.langLabel}
          current={copy.locale}
          hrefs={perLocale(l => `/${l}`)}
          className="text-[13px] font-medium text-ink-soft"
        />
      </header>
      <main>
        <Section polarity="dark" className="flex items-center gap-16">
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-primary-ink md:text-[12px]">{t.promise}</p>
            <h1 className="font-display text-[clamp(2.2rem,7vw,3.75rem)] font-bold leading-[1.02] tracking-[-0.02em] text-ink">
              {t.brandPage.h1}
            </h1>
            <p className="text-[15.5px] leading-[1.6] text-ink-soft md:text-[18px]">{t.brandPage.lede}</p>
          </div>
          {/* The apex has no form: its one action is choosing a point, below. */}
          <ProofAside copy={copy} href="#points" opensForm={false} />
        </Section>
        <LocationList copy={copy} locations={locations} />
      </main>
      <footer className="border-t border-border px-[var(--page-px)] py-10 text-[13px] text-ink-soft">
        <p>
          © {site.brand.legalName} · <a href={telHref(CARD.phone)}>{CARD.phone}</a> ·{" "}
          <a href={`mailto:${CARD.email}`}>{CARD.email}</a>
        </p>
      </footer>
    </>
  );
}
