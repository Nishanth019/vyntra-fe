import type { IconName } from '@/components/ui/icon';
import type { Tone } from '@/components/ui/icon-badge';
import type { BusinessAccount, PgBill, PgTenancy, PgTenant } from '@/lib/api';
import { daysUntil, formatDate } from '@/lib/dates';
import { formatMoney } from '@/lib/format';

/** Whether the open business is a PG / hostel (its screens replace the gym ones). */
export function isPg(account: Pick<BusinessAccount, 'business_type'>) {
  return account.business_type.code === 'PG';
}

/** e.g. "Room 101 · Bed 2". */
export function bedLabel(tenancy: Pick<PgTenancy, 'bed'>) {
  return `Room ${tenancy.bed.room.room_number} · Bed ${tenancy.bed.label}`;
}

export const BILLING_CYCLES = [
  { months: 1, label: 'Monthly' },
  { months: 3, label: 'Quarterly' },
  { months: 6, label: 'Half-yearly' },
  { months: 12, label: 'Yearly' },
];

/** e.g. "1st", "22nd". */
export function ordinal(day: number) {
  const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  return `${day}${suffix}`;
}

/** Where a tenant stands: living here, leaving soon, or moved out. */
export function tenantStatus(tenant: Pick<PgTenant, 'tenancy'>): { label: string; tone: Tone } {
  const tenancy = tenant.tenancy;
  if (!tenancy || tenancy.status === 'ENDED') {
    return { label: tenancy?.end_date ? `Left ${formatDate(tenancy.end_date)}` : 'Moved out', tone: 'neutral' };
  }
  if (tenancy.status === 'NOTICE' && tenancy.expected_end_date) {
    const days = daysUntil(tenancy.expected_end_date);
    return { label: days < 0 ? 'Leaving date passed' : `Leaving ${formatDate(tenancy.expected_end_date)}`, tone: 'warning' };
  }
  return { label: 'Living here', tone: 'success' };
}

/** e.g. "Rent 1 Nov – 30 Nov" for a bill. */
export function billTitle(bill: Pick<PgBill, 'period_start' | 'period_end'>) {
  return `${formatDate(bill.period_start)} – ${formatDate(bill.period_end)}`;
}

export function billStatus(bill: Pick<PgBill, 'status' | 'is_overdue'>): { label: string; tone: Tone } {
  if (bill.status === 'PAID') return { label: 'Paid', tone: 'success' };
  if (bill.is_overdue) return { label: bill.status === 'PARTIAL' ? 'Part paid · overdue' : 'Overdue', tone: 'danger' };
  return { label: bill.status === 'PARTIAL' ? 'Part paid' : 'Due', tone: 'warning' };
}

export const ID_TYPES = [
  { value: 'AADHAAR', label: 'Aadhaar' },
  { value: 'PAN', label: 'PAN' },
  { value: 'DL', label: 'Driving licence' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'VOTER', label: 'Voter ID' },
];

export const AMENITIES: { value: string; label: string }[] = [
  { value: 'ATTACHED_BATH', label: 'Attached bath' },
  { value: 'BALCONY', label: 'Balcony' },
  { value: 'CUPBOARD', label: 'Cupboard' },
  { value: 'GEYSER', label: 'Geyser' },
  { value: 'TABLE', label: 'Table & chair' },
  { value: 'TV', label: 'TV' },
];

export const DEPOSIT_ENTRY: Record<string, { label: string; icon: IconName; tone: Tone }> = {
  COLLECT: { label: 'Collected', icon: 'savings', tone: 'success' },
  REFUND: { label: 'Refunded', icon: 'renew', tone: 'primary' },
  DEDUCT: { label: 'Kept', icon: 'wallet', tone: 'warning' },
};

/** A ready-to-send rent reminder (or a plain hello when nothing is due). */
export function rentMessage(tenant: Pick<PgTenant, 'first_name' | 'total_due'>, pgName: string, upiId?: string | null) {
  const name = tenant.first_name.trim().split(' ')[0];
  if (Number(tenant.total_due) <= 0) return `Hi ${name}, `;
  const pay = upiId ? ` You can pay by UPI to ${upiId}.` : '';
  return `Hi ${name}, your rent of ${formatMoney(tenant.total_due)} at ${pgName} is pending.${pay} Thank you!`;
}
