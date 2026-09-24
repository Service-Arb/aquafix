import { Eyebrow, Section } from "@evinvest/uikit";
import type { ReactNode } from "react";
import type { Copy } from "@/entities/content";
import type { PageKey } from "@/shared/config/site";

/**
 * The sub-pages' one parameterised head, not three. An `<h1>` of its own
 * rather than the kit's `Display`, which is an `<h2>` — this is the page's
 * title. `aside` is what the page composes beside it (the proof card).
 */
export function PageHead({ copy, page, aside }: { copy: Copy; page: Exclude<PageKey, "home">; aside?: ReactNode }) {
  const p = copy.t.pages[page];
  return (
    <Section polarity="dark" tight className="flex items-center gap-16">
      <div className="flex min-w-0 flex-1 flex-col gap-3 md:gap-3.5">
        <Eyebrow className="text-[10px] tracking-[0.16em] md:text-[11px]">{p.eyebrow}</Eyebrow>
        <h1 className="max-w-[54rem] font-display text-[30px] font-bold leading-[1.14] tracking-[-0.01em] text-ink md:text-[44px]">
          {p.h1(copy.f)}
        </h1>
        <p className="max-w-[48rem] text-[15px] leading-[1.58] text-ink-soft md:text-[17px]">{p.lede}</p>
      </div>
      {aside}
    </Section>
  );
}
