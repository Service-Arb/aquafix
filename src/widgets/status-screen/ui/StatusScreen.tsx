import { StatusScreen as KitStatusScreen } from "@evinvest/kitstart/react";
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

/**
 * The Figma frame over kitstart's screen: the dark polarity, the glow off the
 * primary role, and the frame's own paddings and type sizes.
 *
 * `text-ink` is the dark scope's: kitstart's screen sets no colour of its own,
 * so without it an uncoloured child — the outline button's label — inherited
 * the light scope's ink from `<body>`, the page's own background colour.
 * The outline's rule takes `ink-soft` at 60 %: the dark scope's border token
 * is 1.55:1 on the background, under the 3:1 a control's edge needs.
 */
const FRAME = [
  "dark text-ink",
  "before:pointer-events-none before:absolute before:inset-x-0 before:top-24 before:h-[760px] before:content-['']",
  "before:bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--primary)_16%,transparent),transparent_65%)]",
  "[&>header]:gap-0 md:[&>header]:py-[22px] [&>header>a:last-child]:leading-[inherit]",
  // On a phone the lock-up, the switch and the number share one line; the
  // number never wraps, so everything else gives way; under 360 px the
  // wordmark goes and the mark stays (the link keeps the brand's name).
  "max-[359px]:[&>header>a:first-child>span>span]:hidden",
  "[&_header_nav]:mr-3 md:[&_header_nav]:mr-5 [&_header_nav]:text-[12px] md:[&_header_nav]:text-[13px] [&_header_nav]:leading-[inherit]",
  "[&>header>a:last-child]:whitespace-nowrap [&>header>a:last-child]:text-[14px] md:[&>header>a:last-child]:text-xl",
  "[&>main>div>a:nth-child(2)]:border-ink-soft/60",
  "md:[&>main]:py-[110px]",
  "[&>main>p:nth-of-type(1)]:text-[11px] md:[&>main>p:nth-of-type(1)]:text-[12px] [&>main>p:nth-of-type(1)]:leading-[inherit] [&>main>p:nth-of-type(1)]:tracking-[0.22em]",
  "[&>main>p:nth-of-type(2)]:text-[88px] md:[&>main>p:nth-of-type(2)]:text-[150px] [&>main>p:nth-of-type(2)]:tracking-[-0.02em] [&>main>p:nth-of-type(2)]:[font-variant-numeric:tabular-nums]",
  "[&_h1]:text-[26px] md:[&_h1]:text-[40px] [&_h1]:leading-[1.25]",
  "[&>main>p:nth-of-type(3)]:max-w-[41rem] [&>main>p:nth-of-type(3)]:text-[15px] md:[&>main>p:nth-of-type(3)]:text-[17px] [&>main>p:nth-of-type(3)]:leading-[1.6]",
  "[&>main>ul]:text-[14px] [&>main>ul]:leading-[inherit] sm:[&>main>ul]:gap-[26px]",
  "[&>footer]:text-[11.5px] [&>footer]:leading-[inherit] [&>footer]:tracking-[0.08em]",
].join(" ");

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
      logo={
        <Lockup mark="h-6 w-[21px] text-primary md:h-[30px] md:w-[26px]" word="text-[19px] text-ink md:text-[23px]" />
      }
      mark={<Mark className="h-[54px] w-[47px] text-primary" />}
      className={FRAME}
      buttonClassName={CTA_FACE}
    />
  );
}
