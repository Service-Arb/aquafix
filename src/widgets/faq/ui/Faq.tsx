import { Display, Eyebrow, Section } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";

/**
 * `<details>`, not an accordion component: it opens without hydration, is
 * keyboard- and screen-reader-correct for free, and the FAQPage schema.org
 * node reads the same strings.
 */
export function Faq({ copy }: { copy: Copy }) {
  const { t, f } = copy;
  return (
    <Section surface="card" tight id="faq">
      <div className="flex flex-col gap-6 md:gap-11">
        <div className="flex flex-col gap-2 md:gap-3.5">
          <Eyebrow>{t.faqHead.eyebrow}</Eyebrow>
          <Display>{t.faqHead.title}</Display>
        </div>
        <div className="overflow-hidden rounded-[var(--corner-card)] border border-border bg-background">
          {t.faqs.map((faq, i) => (
            <details key={i} className="border-b border-border last:border-b-0">
              <summary className="flex items-start gap-4 px-5 py-5 md:px-[30px] md:pb-[26px] md:pt-6">
                <span className="flex-1 font-display text-[17px] font-bold leading-[1.35] text-ink md:text-[19px]">
                  {faq.q(f)}
                </span>
                <span className="text-[18px] text-primary-ink" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="px-5 pb-5 text-[15px] leading-[1.65] text-ink-soft md:px-[30px] md:pb-[26px] md:text-[15.5px]">
                {faq.a(f)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}
