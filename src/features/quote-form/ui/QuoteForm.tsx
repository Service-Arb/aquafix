import { PHONE_INPUT_PROPS, QuoteFormShell } from "@evinvest/kitstart/react";
import { Button, Check, Field, FieldLabel, Input, NativeSelect, NativeSelectOption } from "@evinvest/uikit";
import type { CopyOf, Text } from "@/entities/content";
import type { PlaceView } from "@/entities/place";
import { LEAD } from "@/shared/config/lead";
import { CTA_FACE } from "@/shared/ui/brand";

/**
 * On top of the kit's `lg` control (16px inset and 16px type at every width —
 * a bare `text-[16px]` here would lose to the kit's `md:text-sm`): the 52px
 * Figma height on the card plane.
 */
const CONTROL = "h-auto w-full rounded-[var(--corner-control)] border border-input bg-card py-[15px] text-ink shadow-none";
const FIELD = "flex w-full flex-col gap-2";
const LABEL = "text-[12.5px] font-medium tracking-[0.06em] text-ink-mid";

/**
 * kitstart's `QuoteFormShell` — a plain `<form method="post" action="/quote">`
 * answered with a 303, carrying the hidden fields and the honeypot the funnel
 * reads — around the three fields a plumbing quote asks for. It has to work
 * before any JavaScript arrives, because that is when the visitor standing in
 * water submits it. The kit's `NativeSelect` is a real `<select>` and `Field`
 * mints the label's `for` with `useId`, so both hold with scripting off.
 */
export type QuoteFormWidgetCopy = CopyOf<Pick<Text, "quoteForm" | "jobs">>;

export function QuoteForm({ copy, point, renderedAt }: { copy: QuoteFormWidgetCopy; point: PlaceView; renderedAt: number }) {
  const q = copy.t.quoteForm;
  return (
    <QuoteFormShell
      placeSlug={point.place.slug}
      locale={copy.locale}
      renderedAt={renderedAt}
      honeypotLabel={q.honeypotLabel}
      // A light island inside a dark band.
      className="light rounded-[var(--corner-float)] bg-background px-6 py-7 text-ink shadow-overlay md:px-[34px] md:pb-[30px] md:pt-8"
    >
      <div className="flex flex-col gap-[7px]">
        <p className="font-display text-[24px] font-bold text-ink md:text-[30px]">{q.title}</p>
        <p className="text-[15px] text-ink-soft">{q.lede}</p>
      </div>
      <Field className={FIELD}>
        <FieldLabel className={LABEL}>{q.jobLabel}</FieldLabel>
        <NativeSelect size="lg" name={LEAD.wire.subject} required className={CONTROL} defaultValue={LEAD.subjects[0]}>
          {LEAD.subjects.map(id => (
            <NativeSelectOption key={id} value={id}>
              {copy.t.jobs[id]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <Field className={FIELD}>
        <FieldLabel className={LABEL}>{q.zipLabel}</FieldLabel>
        <Input size="lg" className={CONTROL} type="text" name={LEAD.wire.locality} autoComplete="postal-code" placeholder={q.zipPlaceholder} required />
      </Field>
      <Field className={FIELD}>
        <FieldLabel className={LABEL}>{q.mobileLabel}</FieldLabel>
        <Input size="lg" className={CONTROL} {...PHONE_INPUT_PROPS} name={LEAD.wire.mobile} placeholder={q.mobilePlaceholder} required />
      </Field>
      <Button type="submit" size="xl" className={`w-full ${CTA_FACE}`}>
        {q.submit}
      </Button>
      <p className="text-[13px] leading-[1.52] text-ink-soft">{q.reassurance(copy.f)}</p>
      <div className="h-px w-full bg-border" />
      <div className="flex items-center gap-2.5">
        <Check />
        <span className="text-[13px] font-medium text-ink-mid">{q.privacy}</span>
      </div>
    </QuoteFormShell>
  );
}
