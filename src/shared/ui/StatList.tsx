/**
 * Figures over labels, as a `<dl>`: the Figma `Hero / Stat`. The label is the
 * term and comes first in the markup; the figure is read first on screen.
 */
export function StatList({
  stats,
  className,
}: {
  stats: readonly { figure: string; label: string }[];
  /** The list's own layout: a row, a 2×2 grid. */
  className: string;
}) {
  return (
    <dl className={className}>
      {stats.map(s => (
        <div key={s.label} className="flex flex-col-reverse gap-1 leading-[normal]">
          <dt className="text-[10px] font-medium tracking-[0.1em] text-ink-soft md:text-[10.5px]">{s.label}</dt>
          <dd className="whitespace-nowrap font-display font-num text-[21px] font-bold text-ink md:text-[25px]">{s.figure}</dd>
        </div>
      ))}
    </dl>
  );
}
