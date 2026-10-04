/** `YYYY-MM-DD` in the device's local time zone, the date format the API expects. */
export function toISODate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Parses an API `YYYY-MM-DD` date as a local date (`new Date(string)` would treat it as UTC). */
export function parseISODate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isValidISODate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toISODate(parseISODate(value)) === value;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Whole days from today until `value` (negative once it has passed). */
export function daysUntil(value: string) {
  const today = parseISODate(toISODate(new Date()));
  return Math.round((parseISODate(value).getTime() - today.getTime()) / 86_400_000);
}

/** e.g. "12 Oct 2026". */
export function formatDate(value: string) {
  return parseISODate(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Formats typed digits as `YYYY-MM-DD` so a date can be entered without a picker. */
export function formatDateInput(text: string) {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean).join('-');
}

/** e.g. "Sun, 4 Oct 2026". */
export function formatLongDate(value: string) {
  return parseISODate(value).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Local time of an API datetime, e.g. "7:30 AM". */
export function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
