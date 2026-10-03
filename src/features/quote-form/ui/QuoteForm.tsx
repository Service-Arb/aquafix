import { LEAD_CAPTURE_TEXT, type LeadCaptureText } from "@evinvest/kitstart";
import { LeadCapture, type LeadCapturePart, type LeadCaptureLayout, type PartClassNames } from "@evinvest/kitstart/react";
import { Check } from "@evinvest/uikit";
import { JOB_PRICE, type CopyOf, type JobId, type Text } from "@/entities/content";
import type { PlaceView } from "@/entities/place";
import { LEAD } from "@/shared/config/lead";
import { CTA_FACE } from "@/shared/ui/brand";

/**
 * On top of the kit's `lg` control (16px inset and 16px type at every width —
 * a bare `text-[16px]` here would lose to the kit's `md:text-sm`): the 52px
 * Figma height on the card plane, 24px line + 2×13px + 2×1px border.
 */
const CONTROL = "h-auto w-full rounded-[var(--corner-control)] border border-input bg-card py-[13px] text-ink shadow-none";
/** Set solid, as the frame's `normal` leading: the page's 1.5 added ~40px to the card. */
const LABEL = "text-[12.5px] font-medium leading-[normal] tracking-[0.06em] text-ink-mid";
/** The kit's `xl` button over `LeadCapture`'s `touch`: the brand's CTA, as every other one on the page. */
const CTA = `min-h-0 px-[var(--control-px)] py-[var(--control-py)] text-[length:var(--control-text)] ${CTA_FACE}`;

/**
 * The card is the kit's root — `#quote`, so a CTA lands on its top edge, title
 * and all; the form inside it keeps the kit's own gap, so the head, the fields
 * and the reassurance under the submit sit where the hand-built card had them.
 */
const PARTS: PartClassNames<LeadCapturePart> = {
  // A light island inside a dark band.
  root: "light gap-5 rounded-[var(--corner-float)] bg-background px-6 py-7 text-ink shadow-overlay md:px-[34px] md:pb-[30px] md:pt-8",
  field: "w-full",
  label: LABEL,
  control: CONTROL,
  need: "rounded-[var(--corner-control)] bg-card text-[15px]",
  trust: "gap-5",
  submit: CTA,
  // The privacy line is the trust slot's last row, with its tick.
  privacy: "hidden",
  channel: CTA,
};

export type QuoteFormWidgetCopy = CopyOf<Pick<Text, "quoteForm" | "jobs">>;

/** Every word of the form: the kit's, with this brand's own where it has one. */
function leadText(copy: QuoteFormWidgetCopy, priceAnchor: boolean): LeadCaptureText {
  const q = copy.t.quoteForm;
  return {
    ...LEAD_CAPTURE_TEXT[copy.locale],
    title: q.title,
    lede: q.lede,
    needLabel: q.jobLabel,
    localityLabel: q.zipLabel,
    phoneLabel: q.mobileLabel,
    submit: priceAnchor ? q.anchored.submit : q.submit,
    privacy: q.privacy,
    honeypotLabel: q.honeypotLabel,
  };
}

/**
 * kitstart's `LeadCapture` in this brand's card: the job (not asked again when
 * the visitor tapped one on the page — `data-need` on the work tiles and the
 * price rows), the postcode (filled with the storefront's own, which the kit
 * reads off the place), the mobile, and "call me back". Over the kit's
 * `QuoteFormShell`, so it still posts before any JavaScript arrives, which is
 * when the visitor standing in water submits it.
 *
 * The call and WhatsApp are not repeated in the card: the hero offers both
 * beside it (`HeroActions`), so the kit is given no number and keeps to the
 * form and the callback.
 *
 * `priceAnchor` is the `quote_price_anchor` treatment (docs/EXPERIMENTS.md):
 * each job's published "from" price in its label, read from the same
 * `PRICE_LIST` integer the price table prints, and a submit that names it.
 * `layout` is `lead_layout`'s arm, passed to the kit with the assignment so
 * its `lead_form_*` events carry it.
 */
export function QuoteForm({
  copy,
  point,
  renderedAt,
  priceAnchor = false,
  layout = "single",
  experiment,
}: {
  copy: QuoteFormWidgetCopy;
  point: PlaceView;
  renderedAt: number;
  priceAnchor?: boolean;
  layout?: LeadCaptureLayout;
  experiment?: { name: string; variant: string };
}) {
  const q = copy.t.quoteForm;
  const label = (id: JobId): string => {
    const price = priceAnchor ? JOB_PRICE[id] : null;
    return price ? q.anchored.option(copy.t.jobs[id], copy.f.price(price)) : copy.t.jobs[id];
  };
  return (
    <LeadCapture
      place={point.place}
      contact={{ phone: null, whatsapp: null }}
      locale={copy.locale}
      renderedAt={renderedAt}
      wire={LEAD.wire}
      needs={LEAD.subjects.map(id => ({ value: id, label: label(id) }))}
      layout={layout}
      experiment={experiment}
      text={leadText(copy, priceAnchor)}
      head={
        <div className="flex flex-col gap-[7px]">
          <p className="font-display text-[24px] font-bold leading-[1.1] text-ink md:text-[30px]">{q.title}</p>
          <p className="text-[15px] leading-[normal] text-ink-soft">{q.lede}</p>
        </div>
      }
      trust={
        <>
          {priceAnchor && <p className="-mt-2 text-center text-[13px] font-medium leading-[normal] text-ink-mid">{q.anchored.note}</p>}
          <p className="text-[13px] leading-[1.52] text-ink-soft">{q.reassurance(copy.f)}</p>
          <div className="h-px w-full bg-border" />
          <div className="flex items-center gap-2.5">
            <Check />
            <span className="text-[13px] font-medium text-ink-mid">{q.privacy}</span>
          </div>
        </>
      }
      classNames={PARTS}
    />
  );
}
