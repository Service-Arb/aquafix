import { Button } from "@evinvest/uikit";
import type { CopyOf, HomeCopy } from "@/entities/content";
import { CTA_FACE } from "@/shared/ui/brand";
import { StatList } from "@/shared/ui/StatList";

export type ProofAsideCopy = CopyOf<{ home: Pick<HomeCopy, "stats"> }>;

/**
 * The home page's four figures and its one action, beside a page head that
 * has no hero to carry them. From `lg` only: a phone has the call bar, the
 * mobile frames have no aside, and at 768 its 380px squeezed the head's
 * column narrower than its words. `label` names where `href` goes — the form
 * on a point, the list of points on the apex.
 */
export function ProofAside({
  copy,
  href,
  label,
  opensForm,
}: {
  copy: ProofAsideCopy;
  href: string;
  label: string;
  opensForm: boolean;
}) {
  return (
    <aside className="hidden w-[380px] shrink-0 flex-col gap-[18px] rounded-[var(--corner-card)] border border-border bg-card p-6 lg:flex">
      <StatList stats={copy.t.home.stats(copy.f)} className="grid grid-cols-2 gap-x-5 gap-y-4" />
      <Button href={href} size="lg" {...(opensForm ? { "data-intent": "form_open" } : {})} className={`w-full ${CTA_FACE}`}>
        {label}
      </Button>
    </aside>
  );
}
