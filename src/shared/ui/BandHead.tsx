/**
 * One heading, optionally one line. A band gets at most these two things
 * before its object starts — the page's whole density argument.
 */
export function BandHead({ title, lede }: { title: string; lede?: string }) {
  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <h2 className="font-display text-[26px] font-bold leading-[1.12] tracking-[-0.01em] text-ink md:text-[38px]">
        {title}
      </h2>
      {lede && <p className="max-w-[52ch] text-[15px] leading-[1.6] text-ink-soft md:text-[17px]">{lede}</p>}
    </div>
  );
}
