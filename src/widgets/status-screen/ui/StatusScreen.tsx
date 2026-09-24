import { telHref } from "@evinvest/marketing";
import { Button, Check } from "@evinvest/uikit";
import type { CopyOf, StatusAction, StatusCopy, Text } from "@/entities/content";
import type { Locale } from "@/shared/config/i18n";
import { site } from "@/shared/config/site";
import { CTA_FACE, Lockup, Mark } from "@/shared/ui/brand";
import { LangSwitch } from "@/shared/ui/LangSwitch";

/** The words a status screen prints besides its own `StatusCopy`. */
export type StatusScreenCopy = CopyOf<
  Pick<Text, "callLabel" | "backHome" | "tryAgain" | "statusStrip" | "facts">
>;

export interface StatusTarget {
  phone: string;
  home: string;
  /** Where "try again" goes; the error boundary passes its own `reset`. */
  retry: string;
  langHrefs: Record<Locale, string>;
}

/**
 * The 404, the 500 and the post-submit confirmation: one screen over a
 * `StatusCopy`, differing only in eyebrow, numeral, headline and buttons. A
 * visitor who hit a 404 still gets the offer — the strip is the hero's three
 * terms, compressed — and the phone is always one tap away.
 */
export function StatusScreen({ copy, status, target }: { copy: StatusScreenCopy; status: StatusCopy; target: StatusTarget }) {
  const { t, f } = copy;
  const action = (a: StatusAction) =>
    a === "call"
      ? { href: telHref(target.phone), label: t.callLabel(f) }
      : a === "home"
        ? { href: target.home, label: t.backHome }
        : { href: target.retry, label: t.tryAgain };
  const [primary, secondary] = [action(status.primary), action(status.secondary)];
  return (
    <div className="dark relative flex min-h-screen flex-col bg-background">
      {/* The design's glow: a gradient off the primary role, not an asset. */}
      <div className="pointer-events-none absolute inset-x-0 top-24 h-[760px] bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--primary)_16%,transparent),transparent_65%)]" />
      <header className="relative flex items-center border-b border-border px-5 py-4 md:px-12 md:py-[22px]">
        <a href={target.home} aria-label={site.brand.name}>
          <Lockup mark="h-[30px] w-[26px] text-primary" word="text-[23px] text-ink" />
        </a>
        <div className="flex-1" />
        <LangSwitch current={copy.locale} hrefs={target.langHrefs} className="mr-5 text-[13px] font-medium text-ink-soft" />
        <a href={telHref(target.phone)} className="font-display text-[16px] font-bold text-primary-ink md:text-[20px]">
          {target.phone}
        </a>
      </header>
      <main className="relative flex flex-1 flex-col items-center gap-5 px-5 py-12 text-center md:gap-6 md:py-[110px]">
        <Mark className="h-[54px] w-[47px] text-primary" />
        <p className="text-[11px] font-medium tracking-[0.22em] text-primary-ink md:text-[12px]">{status.eyebrow}</p>
        <p className="font-display font-num text-[88px] font-bold leading-none tracking-[-0.02em] text-ink md:text-[150px]">
          {status.code}
        </p>
        <h1 className="font-display text-[26px] font-bold leading-[1.25] text-ink md:text-[40px]">
          {status.headline[0]}
          <span className="text-primary-ink">{status.headline[1]}</span>
        </h1>
        <p className="max-w-[41rem] text-[15px] leading-[1.6] text-ink-soft md:text-[17px]">{status.body(f)}</p>
        <div className="flex flex-col gap-3.5 sm:flex-row">
          <Button href={primary.href} size="xl" className={CTA_FACE}>
            {primary.label}
          </Button>
          <Button href={secondary.href} size="xl" variant="outline" className={CTA_FACE}>
            {secondary.label}
          </Button>
        </div>
        <div className="flex flex-col items-center gap-3 text-[14px] sm:flex-row sm:gap-[26px]">
          {t.statusStrip.map(term => (
            <span key={term} className="flex items-center gap-2">
              <Check />
              <span className="font-medium text-ink-soft">{term}</span>
            </span>
          ))}
        </div>
      </main>
      <footer className="relative flex flex-col gap-3 border-t border-border px-5 py-6 text-[11.5px] tracking-[0.08em] text-ink-soft md:flex-row md:items-center md:px-12 md:py-7">
        <p>{t.facts(f).join(" · ").toUpperCase()}</p>
      </footer>
    </div>
  );
}
