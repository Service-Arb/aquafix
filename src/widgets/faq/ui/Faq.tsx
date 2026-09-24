import { Faq as KitFaq } from "@evinvest/kitstart/react";
import { Display, Eyebrow, Section } from "@evinvest/uikit";
import { faqItems, type Copy } from "@/entities/content";

/**
 * kitstart's FAQ: `<details>`, which opens without hydration, and the same
 * strings the FAQPage schema.org node reads (`faqItems`).
 */

/** The Figma frame's geometry over kitstart's type scale: corner, padding, sizes, leading. */
const FRAME = [
  "[&>div:last-child]:rounded-[var(--corner-card)]",
  "md:[&_summary]:px-[30px] md:[&_summary]:pb-[26px]",
  "[&_summary>span:first-child]:text-[17px] md:[&_summary>span:first-child]:text-[19px] [&_summary>span:first-child]:leading-[1.35]",
  "[&_summary>span:last-child]:leading-[inherit]",
  "[&_details>p]:text-[15px] md:[&_details>p]:text-[15.5px] [&_details>p]:leading-[1.65] md:[&_details>p]:px-[30px] md:[&_details>p]:pb-[26px]",
].join(" ");

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
        className={FRAME}
      />
    </Section>
  );
}
