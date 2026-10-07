"use client";

import { LeadCapture, type LeadCaptureProps } from "@evinvest/kitstart/react";

/**
 * `lead_channel` `d` (AQ-3): the card stays after the lead and says whom we
 * call back — the number as typed, known in the browser only — over the
 * kit's photo ask. A client leaf because `done` reads the lead it is given: a
 * function cannot cross from the server component that builds the card.
 */
export function ThanksCapture({ doneTitle, doneBody, ...props }: LeadCaptureProps & { doneTitle: string; doneBody: string }) {
  return (
    <LeadCapture
      {...props}
      done={sent => (
        <div className="flex flex-col gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-full border-2 border-primary-ink font-semibold text-primary-ink"
          >
            ✓
          </span>
          <p className="font-display text-[24px] font-bold leading-[1.1] text-ink">{doneTitle}</p>
          <p className="text-[15px] leading-[normal] text-ink-soft">{doneBody.replace("{phone}", sent.phone.trim())}</p>
        </div>
      )}
    />
  );
}
