import { Button } from "@evinvest/uikit";
import type { CopyOf, HomeCopy, Text } from "@/entities/content";
import { CTA_FACE } from "@/shared/ui/brand";
import { StatList } from "@/shared/ui/StatList";

export type ProofAsideCopy = CopyOf<Pick<Text, "cta"> & { home: Pick<HomeCopy, "stats"> }>;

/**
 * The home page's four figures and its one action, beside a page head that
 * has no hero to carry them. Desktop only: a phone has the call bar, and the
 * mobile frames have no aside.
 */
export function ProofAside({ copy, href, opensForm }: { copy: ProofAsideCopy; href: string; opensForm: boolean }) {
  return (
    <aside className="hidden w-[380px] shrink-0 flex-col gap-[18px] rounded-[var(--corner-card)] border border-border bg-card p-6 md:flex">
      <StatList stats={copy.t.home.stats(copy.f)} className="grid grid-cols-2 gap-x-5 gap-y-4" />
      <Button href={href} size="lg" {...(opensForm ? { "data-intent": "form_open" } : {})} className={`w-full ${CTA_FACE}`}>
        {copy.t.cta}
      </Button>
    </aside>
  );
}
