import { Section, SectionHead } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";

/** Four people, named — you know which one before they knock. */
export function Crew({ copy }: { copy: Copy }) {
  const { t, f } = copy;
  const head = t.crewHead;
  return (
    <Section tight id="crew">
      <div className="flex flex-col gap-6 md:gap-11">
        <SectionHead eyebrow={head.eyebrow} title={head.title(f)} lede={head.lede} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.crew.map(member => (
            <div
              key={member.initials}
              id={`crew-${member.initials}`}
              className="flex flex-col gap-4 rounded-[var(--corner-card)] border border-border bg-card px-6 py-[26px]"
            >
              <div className="flex size-[66px] items-center justify-center rounded-full bg-brand font-display text-[22px] font-bold text-primary">
                {member.initials}
              </div>
              <div className="flex flex-col gap-[5px]">
                <p className="font-display text-[20px] font-bold text-ink">{member.name}</p>
                <p className="text-[14px] font-medium text-ink-soft">{member.role}</p>
              </div>
              <div className="flex flex-col gap-[5px] text-[13.5px] text-ink-mid">
                <p>{member.years}</p>
                <p>{member.credential}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
