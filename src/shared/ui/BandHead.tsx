import type { ReactNode } from "react";

/** The band eyebrow's face, shared with the hero's. */
export const EYEBROW = "text-[10.5px] font-semibold leading-[normal] tracking-[0.16em] text-primary-ink md:text-[12px]";

/**
 * One heading, optionally one line under it and one thing beside it. A band
 * gets at most these before its object starts — the page's whole density
 * argument. `aside` sits right of the heading from `md`, on its baseline, and
 * under it below.
 */
export function BandHead({
  eyebrow,
  title,
  lede,
  aside,
}: {
  eyebrow?: string;
  title: string;
  lede?: ReactNode;
  aside?: ReactNode;
}) {
  const lead = (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="flex flex-col gap-2.5 md:gap-3.5">
        {eyebrow && <p className={EYEBROW}>{eyebrow}</p>}
        <h2 className="font-display text-[26px] font-bold leading-[1.12] tracking-[-0.01em] text-ink md:text-[38px]">
          {title}
        </h2>
      </div>
      {typeof lede === "string" ? (
        <p className="max-w-[52ch] text-[15px] leading-[1.6] text-ink-soft md:text-[17px]">{lede}</p>
      ) : (
        lede
      )}
    </div>
  );
  if (!aside) return lead;
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-10">
      {lead}
      {aside}
    </div>
  );
}
