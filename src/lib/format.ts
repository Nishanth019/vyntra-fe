import type { Attendance, DurationType, Member } from '@/lib/api';
import { formatTime } from '@/lib/dates';

/** Amounts are stored without a currency; the app shows them in rupees. */
export function formatMoney(amount: string | number) {
  const value = Number(amount);
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: Number.isInteger(value) ? 0 : 2 })}`;
}

/** e.g. "1 Month", "3 Months", "15 Days". */
export function formatDuration(value: number, type: DurationType) {
  const unit = type.name.replace(/s$/i, '');
  return `${value} ${unit}${value === 1 ? '' : 's'}`;
}

export function memberName(member: Pick<Member, 'first_name' | 'last_name'>) {
  return [member.first_name, member.last_name].filter(Boolean).join(' ');
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** e.g. "In 7:30 AM · Out 9:05 AM". */
export function attendanceTimes(record: Attendance) {
  if (!record.check_in_time) return 'Present (no time recorded)';
  const checkIn = `In ${formatTime(record.check_in_time)}`;
  return record.check_out_time ? `${checkIn} · Out ${formatTime(record.check_out_time)}` : checkIn;
}
