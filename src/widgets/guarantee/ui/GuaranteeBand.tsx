import { Section } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import { BandHead } from "@/shared/ui/BandHead";

/**
 * Three terms, no prose. A pillar's body is the argument for the term; the
 * term is the promise, and on the home page only the promise is said. Each is
 * written as something the company pays for, never as an adjective.
 */
export function GuaranteeBand({ copy }: { copy: Copy }) {
  const { t } = copy;
  return (
    <Section polarity="dark" surface="card" id="guarantee">
      <div className="flex flex-col gap-7 md:gap-10">
        <BandHead title={t.home.guaranteeTitle} />
        <ol className="flex flex-col gap-0 md:flex-row md:gap-14">
          {t.pillars.map(pillar => (
            <li
              key={pillar.n}
              className="flex flex-1 items-baseline gap-4 border-b border-border py-5 last:border-b-0 md:border-b-0 md:py-0"
            >
              <span className="font-display font-num text-[22px] font-bold text-primary-ink md:text-[26px]">{pillar.n}</span>
              <p className="font-display text-[17px] font-bold leading-[1.3] text-ink md:text-[21px]">{pillar.title}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
