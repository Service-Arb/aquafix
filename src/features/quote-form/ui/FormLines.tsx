/**
 * The card's small print, each said once: one line under the mobile, and on
 * the urgent call back its own heading. Server-rendered nodes handed to the
 * kit's slots.
 *
 * On the urgent branch of `lead_form` `c` the kit has one phone screen for
 * both branches; what tells them apart is the callback's channel field, a
 * direct child of that screen (`[data-lead-step]`), so the swap is CSS on it.
 * The class names are spelled out whole: Tailwind finds only literal ones.
 */

const TICKED = "-mt-1 gap-2 text-[13px] font-medium leading-4 text-ink-mid before:font-semibold before:text-positive before:content-['✓']";

/** Under the mobile, 8px below it (the screen's 12px gap less 4). */
export function AfterPhone({ line, callLine }: { line: string; callLine?: string | undefined }) {
  if (callLine === undefined) return <p className={`flex ${TICKED}`}>{line}</p>;
  return (
    <>
      <p className={`flex ${TICKED} [[data-lead-step]:has(>input[name=channel][value=callback])>&]:hidden`}>{line}</p>
      <p className={`hidden ${TICKED} [[data-lead-step]:has(>input[name=channel][value=callback])>&]:flex`}>{callLine}</p>
    </>
  );
}

/**
 * The urgent screen's heading, drawn first (`order-first`) on the phone's
 * screen only when the urgency asked for a call back. The phone's label stays
 * the field's accessible name and gives way to it on sight ({@link CALLBACK_STEP}).
 */
export function CallbackHeading({ title, lede }: { title: string; lede: string }) {
  return (
    <div className="order-first hidden flex-col gap-1.5 [[data-lead-step]:has(>input[name=channel][value=callback])>&]:flex">
      <p className="font-display text-[20px] font-bold leading-[22px] text-ink">{title}</p>
      <p className="text-[14px] leading-[normal] text-ink-soft">{lede}</p>
    </div>
  );
}

/** On the screens of `c`: the phone's own label out of sight where {@link CallbackHeading} heads the screen. */
export const CALLBACK_STEP = "[&:has(>input[name=channel][value=callback])>[data-slot=field]>[data-slot=field-label]]:sr-only";
