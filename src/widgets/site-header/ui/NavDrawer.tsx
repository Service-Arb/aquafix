import type { ReactNode } from "react";
import { NAV_IDS, NAV_SUFFIX, type Copy } from "@/entities/content";
import type { PlaceView } from "@/entities/place";
import { DetailsDismiss } from "@/shared/ui/DetailsDismiss";

/** Where the row starts carrying the nav itself; the menu has no job from there. */
const ROW_HAS_NAV = "(min-width: 64rem)";

/**
 * Both headers' menu for the widths their row has no room for the nav. A
 * `<details>`: it opens without hydration, one less thing on the critical
 * path; once hydrated, Escape, a press outside, a followed link and the
 * viewport growing past `lg` close it too.
 *
 * The panel is an overlay on the header — `absolute`, the sticky header its
 * containing block — so opening it never changes the height of anything in
 * flow: a menu in flow grew the header and the page jumped by its height. It
 * scrolls inside itself, and the page behind is locked (`globals.css`, M5).
 * `hidden` until open: a closed `<details>` still lays its content out in a
 * contained box, where the panel's gutters stuck 2px past a 320 viewport.
 *
 * The scrim is outside the `<details>` so a press on it is a press outside
 * the menu, which closes it; `globals.css` shows it while the menu is open.
 * `children` go under the links — what else the row dropped at that width.
 */
export function NavDrawer({
  copy,
  point,
  className,
  children,
}: {
  copy: Copy;
  point: PlaceView;
  className: string;
  children?: ReactNode;
}) {
  const { t } = copy;
  return (
    <>
      <details data-nav-menu className={`group ${className}`}>
        <summary
          className="flex size-11 cursor-pointer list-none items-center justify-center text-ink [&::-webkit-details-marker]:hidden"
          aria-label={t.menuLabel}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5">
            <path d="M3 5h14M3 10h14M3 15h14" className="group-open:hidden" />
            <path d="M5 5l10 10M15 5L5 15" className="hidden group-open:inline" />
          </svg>
        </summary>
        <nav className="absolute inset-x-0 top-full z-10 hidden max-h-[calc(100dvh-var(--header-h))] flex-col gap-3 overflow-y-auto overscroll-contain border-b border-border bg-background px-[var(--page-px)] pb-5 pt-2 shadow-elevated group-open:flex">
          <div className="flex flex-col">
            {NAV_IDS.map(id => (
              <a key={id} href={point.href(NAV_SUFFIX[id])} className="flex h-12 items-center text-[17px] font-medium text-ink">
                {t.nav[id]}
              </a>
            ))}
          </div>
          {children}
        </nav>
        <DetailsDismiss closeFrom={ROW_HAS_NAV} />
      </details>
      <div aria-hidden="true" className="nav-scrim fixed inset-x-0 bottom-0 top-[var(--header-h)] hidden bg-brand/50" />
    </>
  );
}
