import { telHref } from "@evinvest/marketing";
import { Faq as KitFaq, type FaqPart } from "@evinvest/kitstart/react";
import { Display, Eyebrow, Section } from "@evinvest/uikit";
import { faqItems, type Copy } from "@/entities/content";

/**
 * kitstart's FAQ: `<details>`, which opens without hydration, and the same
 * strings the FAQPage schema.org node reads (`faqItems`) — on /prices only;
 * the home page prints the same questions without a second FAQPage.
 */

/**
 * The Figma frame's geometry over kitstart's type scale: corner, padding,
 * sizes, leading, and the head beside the list from `md`.
 */
const FRAME: Partial<Record<FaqPart, string>> = {
  list: "rounded-[var(--corner-card)] md:min-w-0 md:flex-1",
  summary: "md:px-[30px] md:pb-[26px]",
  question: "text-[17px] leading-[1.35] md:text-[19px]",
  icon: "leading-[inherit]",
  answer: "text-[15px] leading-[1.65] md:px-[30px] md:pb-[26px] md:text-[15.5px]",
};

export function Faq({ copy }: { copy: Copy }) {
  const { t, f } = copy;
  const [before, after] = t.faqHead.callAside;
  return (
    <Section surface="card" tight id="faq">
      <KitFaq
        id="faq-list"
        items={faqItems(copy)}
        className="md:flex-row md:items-start md:gap-16"
        head={
          <div className="flex flex-col gap-2 md:w-[400px] md:shrink-0 md:gap-4">
            <Eyebrow>{t.faqHead.eyebrow}</Eyebrow>
            <Display>{t.faqHead.title}</Display>
            {/* The mobile frame has no subtitle: the call bar is the same offer. */}
            <p className="hidden text-[16px] leading-[1.5] text-ink-soft md:block">
              {before}
              <a href={telHref(f.phone)} className="hover:text-primary-ink">
                {f.phone}
              </a>
              {after}
            </p>
          </div>
        }
        classNames={FRAME}
      />
    </Section>
  );
}
