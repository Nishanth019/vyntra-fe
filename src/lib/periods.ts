import { addDays, toISODate } from '@/lib/dates';

export type PeriodKey = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'lastQuarter' | 'thisYear';

export type Period = { key: PeriodKey; label: string; from: string; to: string };

/** Report periods relative to today; weeks start on Monday. */
export function getPeriods(today = new Date()): Period[] {
  const y = today.getFullYear();
  const m = today.getMonth();
  const monday = addDays(today, -((today.getDay() + 6) % 7));
  const quarter = Math.floor(m / 3) * 3;
  const range = (key: PeriodKey, label: string, from: Date, to: Date) => ({
    key,
    label,
    from: toISODate(from),
    to: toISODate(to),
  });

  return [
    range('thisWeek', 'This Week', monday, today),
    range('lastWeek', 'Last Week', addDays(monday, -7), addDays(monday, -1)),
    range('thisMonth', 'This Month', new Date(y, m, 1), today),
    range('lastMonth', 'Last Month', new Date(y, m - 1, 1), new Date(y, m, 0)),
    range('thisQuarter', 'This Quarter', new Date(y, quarter, 1), today),
    range('lastQuarter', 'Last Quarter', new Date(y, quarter - 3, 1), new Date(y, quarter, 0)),
    range('thisYear', 'This Year', new Date(y, 0, 1), today),
  ];
}
