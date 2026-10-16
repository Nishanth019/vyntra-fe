import { api, type MemberQuery } from '@/lib/api';
import { addDays, toISODate } from '@/lib/dates';

export type MemberFilterKey =
  | 'all'
  | 'live'
  | 'expired'
  | 'expiring3'
  | 'expiring7'
  | 'expiring15'
  | 'dues'
  | 'inactive';

type MemberFilter = {
  key: MemberFilterKey;
  label: string;
  /** Extra query params for GET /members/, relative to today. */
  query: (today: Date) => Omit<MemberQuery, 'business_account_id'>;
};

/** Active members whose current membership ends between `from` and `to` days from today. */
function endingBetween(today: Date, from?: number, to?: number) {
  return {
    is_active: true,
    end_date_from: from === undefined ? undefined : toISODate(addDays(today, from)),
    end_date_to: to === undefined ? undefined : toISODate(addDays(today, to)),
  };
}

export const MEMBER_FILTERS: MemberFilter[] = [
  { key: 'all', label: 'All Members', query: () => ({}) },
  { key: 'live', label: 'Live Memberships', query: (today) => endingBetween(today, 0) },
  { key: 'expired', label: 'Expired Memberships', query: (today) => endingBetween(today, undefined, -1) },
  { key: 'expiring3', label: 'Expiring (0–3 Days)', query: (today) => endingBetween(today, 0, 3) },
  { key: 'expiring7', label: 'Expiring (4–7 Days)', query: (today) => endingBetween(today, 4, 7) },
  { key: 'expiring15', label: 'Expiring (8–15 Days)', query: (today) => endingBetween(today, 8, 15) },
  { key: 'dues', label: 'Dues Pending', query: () => ({ is_active: true, has_dues: true }) },
  { key: 'inactive', label: 'Inactive Members', query: () => ({ is_active: false }) },
];

export function isMemberFilterKey(value: unknown): value is MemberFilterKey {
  return MEMBER_FILTERS.some((filter) => filter.key === value);
}

/** Member count for every filter. Each is one request, since the list's `count` is the total across pages. */
export async function fetchMemberCounts(business_account_id: number) {
  const today = new Date();
  const pages = await Promise.all(
    MEMBER_FILTERS.map((filter) => api.members({ business_account_id, ...filter.query(today) })),
  );
  return Object.fromEntries(MEMBER_FILTERS.map((filter, i) => [filter.key, pages[i].count])) as Record<
    MemberFilterKey,
    number
  >;
}
