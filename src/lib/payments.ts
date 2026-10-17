import type { IconName } from '@/components/ui/icon';

export const PAYMENT_METHODS: { value: string; label: string; icon: IconName }[] = [
  { value: 'CASH', label: 'Cash', icon: 'money' },
  { value: 'UPI', label: 'UPI', icon: 'qr' },
  { value: 'CARD', label: 'Card', icon: 'card' },
  { value: 'BANK_TRANSFER', label: 'Bank', icon: 'bank' },
];

export function paymentMethodLabel(value: string) {
  return PAYMENT_METHODS.find((method) => method.value === value)?.label ?? value;
}
