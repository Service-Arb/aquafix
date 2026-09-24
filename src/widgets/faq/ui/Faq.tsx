import { Faq as KitFaq, type FaqPart } from "@evinvest/kitstart/react";
import { Display, Eyebrow, Section } from "@evinvest/uikit";
import { faqItems, type Copy } from "@/entities/content";

/**
 * kitstart's FAQ: `<details>`, which opens without hydration, and the same
 * strings the FAQPage schema.org node reads (`faqItems`).
 */

/** The Figma frame's geometry over kitstart's type scale: corner, padding, sizes, leading. */
const FRAME: Partial<Record<FaqPart, string>> = {
  list: "rounded-[var(--corner-card)]",
  summary: "md:px-[30px] md:pb-[26px]",
  question: "text-[17px] leading-[1.35] md:text-[19px]",
  icon: "leading-[inherit]",
  answer: "text-[15px] leading-[1.65] md:px-[30px] md:pb-[26px] md:text-[15.5px]",
};

export function Faq({ copy }: { copy: Copy }) {
  const { t } = copy;
  return (
    <Section surface="card" tight id="faq">
      <KitFaq
        id="faq-list"
        items={faqItems(copy)}
        head={
          <div className="flex flex-col gap-2 md:gap-3.5">
            <Eyebrow>{t.faqHead.eyebrow}</Eyebrow>
            <Display>{t.faqHead.title}</Display>
          </div>
        }
        classNames={FRAME}
      />
    </Section>
  );
}
