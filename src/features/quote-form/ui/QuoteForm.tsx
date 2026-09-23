import { Button, Check, Field, FieldLabel, Input, NativeSelect, NativeSelectOption } from "@evinvest/uikit";
import { JOB_IDS, type Copy } from "@/entities/content";
import type { Point } from "@/entities/location";
import { CTA_FACE } from "@/shared/ui/brand";
import { HONEYPOT_FIELD, RENDERED_AT_FIELD } from "../model/antispam";
import { FORM_ID_FIELD, LOCALE_FIELD, LOCATION_FIELD } from "../model/accept";

/** Taller and roomier than the kit's default control, on the card plane. */
const CONTROL =
  "h-auto w-full rounded-[var(--corner-control)] border border-input bg-card px-4 py-[15px] text-[16px] text-ink shadow-none";
const FIELD = "flex w-full flex-col gap-2";
const LABEL = "text-[12.5px] font-medium tracking-[0.06em] text-ink-mid";

/**
 * A plain `<form method="post" action="/quote">`, answered with a 303. It has
 * to work before any JavaScript arrives, because that is when the visitor
 * standing in water submits it. The kit's `NativeSelect` is a real `<select>`
 * and `Field` mints the label's `for` with `useId`, so both hold with
 * scripting off; the scripted `Select` would not.
 */
export function QuoteForm({ copy, point, renderedAt }: { copy: Copy; point: Point; renderedAt: number }) {
  const q = copy.t.quoteForm;
  return (
    <form
      id="quote"
      method="post"
      action="/quote"
      // A light island inside a dark band.
      className="light flex w-full flex-col gap-5 rounded-[var(--corner-float)] bg-background px-6 py-7 text-ink shadow-overlay md:px-[34px] md:pb-[30px] md:pt-8"
    >
      <input type="hidden" name={LOCATION_FIELD} value={point.location.slug} />
      <input type="hidden" name={LOCALE_FIELD} value={copy.locale} />
      <input type="hidden" name={FORM_ID_FIELD} value="quote" />
      <input type="hidden" name={RENDERED_AT_FIELD} value={String(renderedAt)} />
      <div className="flex flex-col gap-[7px]">
        <p className="font-display text-[24px] font-bold text-ink md:text-[30px]">{q.title}</p>
        <p className="text-[15px] text-ink-soft">{q.lede}</p>
      </div>
      <Field className={FIELD}>
        <FieldLabel className={LABEL}>{q.jobLabel}</FieldLabel>
        {/* Right padding clears the kit's arrow. */}
        <NativeSelect name="job" required className={`${CONTROL} pr-11`} defaultValue={JOB_IDS[0]}>
          {JOB_IDS.map(id => (
            <NativeSelectOption key={id} value={id}>
              {copy.t.jobs[id]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <Field className={FIELD}>
        <FieldLabel className={LABEL}>{q.zipLabel}</FieldLabel>
        <Input className={CONTROL} type="text" name="zip" autoComplete="postal-code" placeholder={q.zipPlaceholder} required />
      </Field>
      <Field className={FIELD}>
        <FieldLabel className={LABEL}>{q.mobileLabel}</FieldLabel>
        <Input className={CONTROL} type="tel" name="mobile" autoComplete="tel" placeholder={q.mobilePlaceholder} required />
      </Field>
      {/* Off-screen rather than `display: none`, which some bots skip. */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label>
          {q.honeypotLabel}
          <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <Button type="submit" size="xl" className={`w-full ${CTA_FACE}`}>
        {q.submit}
      </Button>
      <p className="text-[13px] leading-[1.52] text-ink-soft">{q.reassurance(copy.f)}</p>
      <div className="h-px w-full bg-border" />
      <div className="flex items-center gap-2.5">
        <Check />
        <span className="text-[13px] font-medium text-ink-mid">{q.privacy}</span>
      </div>
    </form>
  );
}
