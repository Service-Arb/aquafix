import type { ReactNode } from "react";
import { NAV_IDS, NAV_SUFFIX, type Copy } from "@/entities/content";
import type { PlaceView } from "@/entities/place";
import { DetailsDismiss } from "@/shared/ui/DetailsDismiss";

/**
 * Both headers' menu for the widths their row has no room for the nav. A
 * `<details>`: it opens without hydration, one less thing on the critical
 * path; once hydrated, Escape and a press outside close it too. The panel
 * spans the header, which is its containing block (`relative` on the
 * sub-pages, `absolute` over the hero). `children` go under the links — what
 * else the row dropped at that width.
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
    <details className={className}>
      <summary className="flex size-9 cursor-pointer list-none items-center justify-center text-[20px] text-ink" aria-label={t.menuLabel}>
        ☰
      </summary>
      <nav className="absolute inset-x-0 top-full z-20 flex flex-col gap-1 border-b border-border bg-background px-[var(--page-px)] py-3 text-[15px] font-medium text-ink-mid shadow-elevated">
        {NAV_IDS.map(id => (
          <a key={id} href={point.href(NAV_SUFFIX[id])} className="py-2">
            {t.nav[id]}
          </a>
        ))}
        {children}
      </nav>
      <DetailsDismiss />
    </details>
  );
}
