import type { IconName } from '@/components/ui/icon';
import type { ExpenseCategory } from '@/lib/api';

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: IconName }[] = [
  { value: 'RENT', label: 'Rent', icon: 'store' },
  { value: 'ELECTRICITY', label: 'Electricity', icon: 'sun' },
  { value: 'WATER', label: 'Water', icon: 'globe' },
  { value: 'INTERNET', label: 'Internet', icon: 'globe' },
  { value: 'SALARY', label: 'Salaries', icon: 'staff' },
  { value: 'MAINTENANCE', label: 'Maintenance', icon: 'settings' },
  { value: 'REPAIRS', label: 'Repairs', icon: 'edit' },
  { value: 'EQUIPMENT', label: 'Equipment', icon: 'dumbbell' },
  { value: 'GROCERIES', label: 'Groceries', icon: 'store' },
  { value: 'CLEANING', label: 'Cleaning', icon: 'checkCircle' },
  { value: 'SUPPLIES', label: 'Supplies', icon: 'document' },
  { value: 'MARKETING', label: 'Marketing', icon: 'trendUp' },
  { value: 'TAXES', label: 'Taxes & fees', icon: 'bank' },
  { value: 'OTHER', label: 'Other', icon: 'more' },
];

export function expenseCategory(value: ExpenseCategory) {
  return EXPENSE_CATEGORIES.find((category) => category.value === value) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
}

/** The first and last day of the month `offset` months from now, as YYYY-MM-DD, and its name. */
export function monthRange(offset: number) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return {
    from: iso(first),
    to: iso(last),
    month: iso(first).slice(0, 7),
    label: first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
  };
}
