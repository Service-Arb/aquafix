import { Button, Section } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import type { PlaceView } from "@/entities/place";
import { CTA_FACE } from "@/shared/ui/brand";

/** The sub-pages' one action, shared. */
export function InlineCta({ copy, point }: { copy: Copy; point: PlaceView }) {
  const { line, button } = copy.t.inlineCta;
  return (
    <Section surface="primary" tight className="flex flex-col gap-4 md:flex-row md:items-center md:gap-5">
      <p className="flex-1 font-display text-[20px] font-bold text-on-primary md:text-[24px]">{line}</p>
      <Button
        href={point.href("#quote")}
        size="xl"
        data-intent="form_open"
        className={`dark shrink-0 bg-background text-ink hover:bg-background/90 ${CTA_FACE}`}
      >
        {button}
      </Button>
    </Section>
  );
}
