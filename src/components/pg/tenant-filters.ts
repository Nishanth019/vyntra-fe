import type { PgDashboard, PgTenantQuery } from '@/lib/api';

export type TenantFilterKey = 'living' | 'dues' | 'notice' | 'past';

/** The chips above a PG's tenant list. */
export const TENANT_FILTERS: {
  key: TenantFilterKey;
  label: string;
  query: Omit<PgTenantQuery, 'business_account_id'>;
  count?: (stats: PgDashboard) => number;
}[] = [
  { key: 'living', label: 'Living here', query: { status: 'living' }, count: (s) => s.tenants.living },
  { key: 'dues', label: 'Rent due', query: { has_dues: true }, count: (s) => s.dues.tenants },
  { key: 'notice', label: 'Leaving', query: { status: 'notice' }, count: (s) => s.tenants.notice },
  { key: 'past', label: 'Moved out', query: { status: 'past' } },
];

export function isTenantFilterKey(value: unknown): value is TenantFilterKey {
  return TENANT_FILTERS.some((filter) => filter.key === value);
}
