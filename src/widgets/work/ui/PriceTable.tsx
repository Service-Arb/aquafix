import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@evinvest/uikit";
import { PRICE_LIST, type Copy } from "@/entities/content";
import { formatEur } from "@/shared/lib/money";

/**
 * The object the whole page is argued from: nobody else publishes a price. A
 * real `<table>`, so a screen reader and a crawler read it as one; mobile drops
 * the time column rather than restacking, which keeps one markup tree. Each
 * row is `PRICE_LIST`'s integer — the same one the schema.org `Offer` carries.
 * `#prices` stays on it: the header's nav and deep links land here.
 */
export function PriceTable({ copy }: { copy: Copy }) {
  const { t, f, locale } = copy;
  const cols = t.priceColumns;
  // From `md` the frame's columns: 28px gutters, the price 124 wide and the
  // time 162 (so its header wraps to two lines), each width plus its gutter.
  return (
    <div id="prices" className="flex flex-col gap-7 md:gap-9">
      <div className="overflow-hidden rounded-[var(--corner-card)] border border-border">
        <Table className="border-collapse text-left">
          <caption className="sr-only">{t.priceCaption}</caption>
          <TableHeader>
            <TableRow className="border-b border-ink bg-muted text-[10.5px] font-medium leading-[normal] tracking-[0.14em] text-ink-soft md:text-[11px]">
              <TableHead className="h-auto whitespace-normal px-4 py-3 font-medium text-ink-soft md:pl-7 md:pr-0 md:py-4">{cols.job}</TableHead>
              <TableHead className="h-auto whitespace-normal px-4 py-3 text-right font-medium text-ink-soft md:w-[152px] md:pl-7 md:pr-0 md:py-4">
                {cols.price}
              </TableHead>
              <TableHead className="hidden h-auto w-[218px] whitespace-normal px-7 py-4 text-right font-medium text-ink-soft md:table-cell">
                {cols.time}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PRICE_LIST.map(row => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-normal px-4 py-3.5 text-[14.5px] font-semibold text-ink md:pl-7 md:pr-0 md:text-[16px]">
                  {t.prices[row.id].job}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-right font-display font-num text-[17px] font-bold text-primary-ink md:pl-7 md:pr-0 md:text-[19px]">
                  {formatEur(row.fromEur, locale)}
                </TableCell>
                <TableCell className="hidden px-7 py-3.5 text-right text-[15px] text-ink-soft md:table-cell">
                  {t.prices[row.id].time}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-[13.5px] text-ink-soft md:text-[14.5px]">{t.home.pricesNote(f)}</p>
    </div>
  );
}
