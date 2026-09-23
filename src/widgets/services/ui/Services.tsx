import { Section, SectionHead } from "@evinvest/uikit";
import { priceOf, SERVICE_LIST, type Copy } from "@/entities/content";
import { formatEur } from "@/shared/lib/money";

/** Eight jobs, and the refusal that makes the list credible. */
export function Services({ copy }: { copy: Copy }) {
  const { t, f, locale } = copy;
  const head = t.services.head;
  return (
    <Section surface="card" tight>
      <div className="flex flex-col gap-6 md:gap-11">
        <SectionHead eyebrow={head.eyebrow} title={head.title(f)} lede={head.lede} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_LIST.map(service => (
            <div
              key={service.id}
              className="flex flex-col gap-3 rounded-[var(--corner-tile)] border border-border bg-background px-6 pb-[26px] pt-6"
            >
              <p className="font-display text-[19px] font-bold leading-[1.3] text-ink">{t.services.items[service.id].name}</p>
              <p className="font-display font-num text-[17px] font-bold text-primary-ink">
                {service.from ? `${t.services.from} ${formatEur(priceOf(service.from), locale)}` : t.services.quoted}
              </p>
              <p className="text-[14.5px] leading-[1.6] text-ink-soft">{t.services.items[service.id].body}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
