/**
 * The mark, the wordmark and the lock-up — shared byte-for-byte with the
 * printed card through `assets/mark.svg` (inlined at build, see
 * `shared/config/build-env.ts`).
 */

const MARK_PATH = process.env.AQUAFIX_MARK_PATH ?? "";

/**
 * The display face on a call to action. `cn` merges `font-*` as one group, so a
 * `font-display font-semibold` override loses the family to the weight — the
 * weight goes on as a property instead.
 */
export const CTA_FACE = "font-display [font-weight:600]";

/** The hexagon. Colour from the nearest `text-*`, size from `className`. */
export function Mark({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 86.6 100" aria-hidden="true" focusable="false" className={`block ${className}`}>
      <path fillRule="evenodd" d={MARK_PATH} fill="currentColor" />
    </svg>
  );
}

/** AQUA in the surrounding colour, FIX in the primary role. */
export function Wordmark({ className }: { className: string }) {
  return (
    <span className={`font-display font-bold tracking-[0.015em] ${className}`}>
      AQUA<span className="text-primary">FIX</span>
    </span>
  );
}

export function Lockup({ mark, word }: { mark: string; word: string }) {
  return (
    <span className="flex items-center gap-[11px]">
      <Mark className={mark} />
      <Wordmark className={word} />
    </span>
  );
}
