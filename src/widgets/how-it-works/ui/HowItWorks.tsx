import { Display, Eyebrow, Section } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";

export function HowItWorks({ copy }: { copy: Copy }) {
  const { t } = copy;
  return (
    <Section tight>
      <div className="flex flex-col gap-6 md:gap-11">
        <div className="flex flex-col gap-2 md:gap-3.5">
          <Eyebrow>{t.stepsHead.eyebrow}</Eyebrow>
          <Display>{t.stepsHead.title}</Display>
        </div>
        <ol className="grid gap-6 md:grid-cols-3 md:gap-6">
          {t.steps.map(step => (
            <li key={step.n} className="flex flex-col gap-4 border-t-[3px] border-primary pt-5 md:pt-7">
              <p className="font-display font-num text-[28px] font-bold text-primary-ink md:text-[34px]">{step.n}</p>
              <p className="font-display text-[19px] font-bold leading-[1.3] text-ink md:text-[22px]">{step.title}</p>
              <p className="text-[15px] leading-[1.62] text-ink-soft md:text-[15.5px]">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
