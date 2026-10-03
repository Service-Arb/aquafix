import type { Locale } from "@/shared/config/i18n";
import type { DayOfWeek, OpeningHours } from "./types";

const WEEK: readonly DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** `08:00` → `8 h` in French, `8:00` in English; `12:30` → `12 h 30` / `12:30` — as kitstart's opening line writes it. */
function clock(hhmm: string, locale: Locale): string {
  const [h = "0", m = "00"] = hhmm.split(":");
  const hour = String(Number(h));
  if (locale === "fr") return m === "00" ? `${hour} h` : `${hour} h ${m}`;
  return `${hour}:${m}`;
}

/** The short weekday in the page's language: a Monday-anchored date read back through `Intl`. */
function weekday(day: DayOfWeek, locale: Locale): string {
  // 2024-01-01 was a Monday; noon UTC is that day everywhere.
  const date = new Date(Date.UTC(2024, 0, 1 + WEEK.indexOf(day), 12));
  return new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(date);
}

/** Consecutive days as one range (`lun.–ven.`), the rest one by one. */
function daysText(days: readonly DayOfWeek[], locale: Locale): string {
  const sorted = [...new Set(days)].sort((a, b) => WEEK.indexOf(a) - WEEK.indexOf(b));
  const runs: DayOfWeek[][] = [];
  for (const day of sorted) {
    const run = runs.at(-1);
    const last = run?.at(-1);
    if (run && last !== undefined && WEEK.indexOf(day) === WEEK.indexOf(last) + 1) run.push(day);
    else runs.push([day]);
  }
  return runs
    .map(run => {
      const first = run[0];
      const last = run.at(-1);
      if (first === undefined || last === undefined) return "";
      return run.length > 2 ? `${weekday(first, locale)}–${weekday(last, locale)}` : run.map(d => weekday(d, locale)).join(", ");
    })
    .join(", ");
}

/**
 * A place's opening hours as one line — `lun.–ven. 8 h–19 h · sam. 9 h–12 h 30`
 * — or `null` without hours: the copy's own line stands in, never a guess.
 */
export function hoursText(hours: readonly OpeningHours[] | null, locale: Locale): string | null {
  if (hours === null || hours.length === 0) return null;
  return hours.map(h => `${daysText(h.days, locale)} ${clock(h.opens, locale)}–${clock(h.closes, locale)}`).join(" · ");
}
