import { Section } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import type { PlaceView } from "@/entities/place";
import { BandHead } from "@/shared/ui/BandHead";

const LINK = "text-[15px] font-semibold text-primary-ink underline-offset-4 hover:underline";

/**
 * Three terms, each with the one sentence that makes it a term rather than
 * an adjective: something the company pays for when it misses. The whole
 * argument is a link away, on the guarantee page — beside the head from `md`,
 * after the terms on a phone, where it is read last.
 */
export function GuaranteeBand({ copy, point }: { copy: Copy; point: PlaceView }) {
  const { t, f } = copy;
  const h = t.home;
  const href = point.href("/guarantee");
  return (
    <Section polarity="dark" surface="card" tight id="guarantee">
      <div className="flex flex-col gap-7 md:gap-9">
        <BandHead
          eyebrow={h.guaranteeEyebrow}
          title={h.guaranteeTitle}
          aside={
            <a href={href} className={`hidden shrink-0 md:block ${LINK}`}>
              {h.guaranteeLink} →
            </a>
          }
        />
        <ol className="flex flex-col gap-5 md:flex-row md:gap-12">
          {t.pillars.map(pillar => (
            <li key={pillar.n} className="group flex flex-1 flex-col gap-1.5 md:gap-3">
              <div className="flex items-baseline gap-4 border-b border-border py-5 group-last:border-b-0 md:border-b-0 md:py-0">
                <span className="font-display font-num text-[22px] font-bold leading-[1.1] text-primary-ink md:text-[26px]">{pillar.n}</span>
                <p className="font-display text-[17px] font-bold leading-[1.3] text-ink md:text-[21px]">{pillar.title}</p>
              </div>
              <p className="text-[14.5px] leading-[1.5] text-ink-mid md:text-[15px] md:leading-[1.55]">{pillar.body(f)}</p>
            </li>
          ))}
        </ol>
        <a href={href} className={`self-start md:hidden ${LINK}`}>
          {h.guaranteeLink} →
        </a>
      </div>
    </Section>
  );
}
