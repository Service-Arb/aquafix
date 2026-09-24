import { StatusScreen as KitStatusScreen, type StatusScreenPart } from "@evinvest/kitstart/react";
import type { CopyOf, StatusCopy, Text } from "@/entities/content";
import { i18n, LOCALES, type Locale } from "@/shared/config/i18n";
import { site } from "@/shared/config/site";
import { CTA_FACE, Lockup, Mark } from "@/shared/ui/brand";

/** The words a status screen prints besides its own `StatusCopy`. */
export type StatusScreenCopy = CopyOf<Pick<Text, "callLabel" | "backHome" | "tryAgain" | "statusStrip" | "facts">>;

export interface StatusTarget {
  phone: string;
  home: string;
  /** Where "try again" goes. */
  retry: string;
  langHrefs: Record<Locale, string>;
}

/** The dark polarity and the glow off the primary role. */
const ROOT = [
  "dark",
  "before:pointer-events-none before:absolute before:inset-x-0 before:top-24 before:h-[760px] before:content-['']",
  "before:bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--primary)_16%,transparent),transparent_65%)]",
].join(" ");

/**
 * The Figma frame's paddings and type sizes over kitstart's screen. On a phone
 * the lock-up, the switch and the number share one line — kitstart wraps the
 * switch onto its own.
 */
const PARTS: Partial<Record<StatusScreenPart, string>> = {
  header: "flex-nowrap gap-0 py-4 md:gap-0 md:py-[22px]",
  lang: "order-none mr-3 w-auto text-[12px] leading-[inherit] md:mr-5 md:text-[13px]",
  phone: "text-[14px] leading-[inherit] md:text-xl",
  main: "md:py-[110px]",
  eyebrow: "text-[11px] leading-[inherit] tracking-[0.22em] md:text-[12px]",
  code: "text-[88px] leading-none tracking-[-0.02em] tabular-nums md:text-[150px]",
  headline: "text-[26px] leading-[1.25] md:text-[40px]",
  body: "max-w-[41rem] text-[15px] leading-[1.6] md:text-[17px]",
  strip: "text-[14px] leading-[inherit] sm:gap-[26px]",
  footer: "text-[11.5px] leading-[inherit] tracking-[0.08em]",
};

/**
 * The 404, the 500 and the post-submit confirmation: kitstart's screen over a
 * `StatusCopy`, with the brand's lock-up, mark and call-to-action face. A
 * visitor who hit a 404 still gets the offer, and the phone is one tap away.
 * Renders on either side: the error boundary is a client module.
 */
export function StatusScreen({
  copy,
  status,
  target,
}: {
  copy: StatusScreenCopy;
  status: StatusCopy;
  target: StatusTarget;
}) {
  return (
    <KitStatusScreen
      copy={copy}
      status={status}
      target={target}
      locales={LOCALES}
      labels={i18n.labels}
      brandName={site.brand.name}
      // Under 360 px the wordmark goes and the mark stays; the link keeps the brand's name.
      logo={
        <Lockup
          mark="h-6 w-[21px] text-primary md:h-[30px] md:w-[26px]"
          word="text-[19px] text-ink max-[359px]:hidden md:text-[23px]"
        />
      }
      mark={<Mark className="h-[54px] w-[47px] text-primary" />}
      className={ROOT}
      classNames={PARTS}
      buttonClassName={CTA_FACE}
    />
  );
}
