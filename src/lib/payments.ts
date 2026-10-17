import type { IconName } from '@/components/ui/icon';
import { formatMoney } from '@/lib/format';

export const PAYMENT_METHODS: { value: string; label: string; icon: IconName }[] = [
  { value: 'CASH', label: 'Cash', icon: 'money' },
  { value: 'UPI', label: 'UPI', icon: 'qr' },
  { value: 'CARD', label: 'Card', icon: 'card' },
  { value: 'BANK_TRANSFER', label: 'Bank', icon: 'bank' },
];

export function paymentMethodLabel(value: string) {
  return PAYMENT_METHODS.find((method) => method.value === value)?.label ?? value;
}

/** Why a typed payment amount can't be saved, or '' when it's fine. `due` is what's left to pay. */
export function paymentAmountError(text: string, due: number) {
  const amount = Number(text);
  if (!text.trim() || !(amount > 0)) return 'Enter the amount received.';
  if (due <= 0) return 'Nothing is due on this plan.';
  if (amount > due) return `Can't be more than the ${formatMoney(due)} due on this plan.`;
  return '';
}
