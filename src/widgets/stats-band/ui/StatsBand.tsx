import { Section } from "@evinvest/uikit";
import type { CopyOf, HomeCopy } from "@/entities/content";
import { StatList } from "@/shared/ui/StatList";

export type StatsBandCopy = CopyOf<{ home: Pick<HomeCopy, "stats"> }>;

/**
 * The four figures, out of the hero now that the form sits beside the
 * headline: a band of their own, spread across the gutter, 2×2 on a phone.
 */
export function StatsBand({ copy }: { copy: StatsBandCopy }) {
  return (
    <Section polarity="dark" surface="card" id="stats" className="py-6 md:py-7">
      <StatList stats={copy.t.home.stats(copy.f)} className="grid grid-cols-2 gap-x-6 gap-y-5 md:flex md:justify-between" />
    </Section>
  );
}
