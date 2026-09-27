import { telHref } from "@evinvest/marketing";
import { Button } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import type { PlaceView } from "@/entities/place";
import type { Locale } from "@/shared/config/i18n";
import { CTA_FACE } from "@/shared/ui/brand";
import { BrandLangSwitch } from "@/shared/ui/BrandLangSwitch";

/**
 * What the menu carries under its links at the widths the row dropped it:
 * the call to action, then the language switch and — where the row has no
 * phone of its own — the phone. `className` says at which widths.
 */
export function MenuExtras({
  copy,
  point,
  hrefs,
  phone,
  className,
}: {
  copy: Copy;
  point: PlaceView;
  hrefs: Readonly<Record<Locale, string>>;
  phone?: string;
  className?: string;
}) {
  const { t } = copy;
  return (
    <div className={`flex flex-col gap-3 ${className ?? ""}`}>
      <hr className="h-px border-0 bg-border" />
      <Button href={point.href("#quote")} size="xl" data-intent="form_open" className={`w-full ${CTA_FACE}`}>
        {t.cta}
      </Button>
      <div className="flex h-11 items-center justify-between gap-3">
        <BrandLangSwitch label={t.langLabel} current={copy.locale} hrefs={hrefs} className="text-[14px] font-medium text-ink-mid" />
        {phone && (
          <a href={telHref(phone)} aria-label={`${t.headerPhoneLabel}, ${phone}`} className="flex flex-col items-end leading-[normal]">
            <span className="text-[10px] font-medium tracking-[0.08em] text-ink-soft">{t.headerPhoneLabel}</span>
            <span className="whitespace-nowrap font-display text-[18px] font-bold text-ink">{phone}</span>
          </a>
        )}
      </div>
    </div>
  );
}
