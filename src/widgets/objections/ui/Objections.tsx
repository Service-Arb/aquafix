import { Section, SectionHead } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";

/** Four things customers actually said, each answered with a written term. */
export function Objections({ copy }: { copy: Copy }) {
  const { t, f } = copy;
  const head = t.objectionsHead;
  return (
    <Section tight>
      <div className="flex flex-col gap-6 md:gap-12">
        <SectionHead eyebrow={head.eyebrow} title={head.title(f)} lede={head.lede} />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {t.objections.map(o => (
            <div
              key={o.title}
              className="flex flex-col gap-4 rounded-[var(--corner-card)] border border-border bg-card px-[26px] pb-7 pt-[26px] md:gap-[18px]"
            >
              <p className="text-[15px] font-medium leading-[1.5] text-ink-soft">{o.quote(f)}</p>
              <div className="h-0.5 w-10 bg-primary" />
              <p className="font-display text-[19px] font-bold leading-[1.3] text-ink md:text-[21px]">{o.title}</p>
              <p className="text-[14.5px] leading-[1.6] text-ink-mid">{o.body(f)}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
