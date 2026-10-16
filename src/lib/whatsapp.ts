import { Linking } from 'react-native';

import type { BusinessAccount, Member } from '@/lib/api';
import { formatDate } from '@/lib/dates';
import { formatMoney } from '@/lib/format';

export type WhatsAppMessage = 'reminder' | 'dues' | 'receipt';

/** wa.me needs the number with country code; 10-digit numbers are taken as Indian. */
function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? `91${digits}` : digits;
}

/** The ready-made message for a member, or null when it doesn't apply to them. */
export function whatsappText(kind: WhatsAppMessage, member: Member, account: BusinessAccount) {
  const membership = member.membership;
  const greeting = `Hi ${member.first_name},`;
  const gym = account.name;

  if (kind === 'reminder' && membership) {
    return member.status === 'expired' || member.status === 'inactive'
      ? `${greeting} your ${membership.membership_plan.name} membership at ${gym} ended on ${formatDate(membership.end_date)}. We miss you! Renew anytime and get back on track. 💪`
      : `${greeting} your ${membership.membership_plan.name} membership at ${gym} ends on ${formatDate(membership.end_date)}. Renew in time to keep training without a break! 💪`;
  }
  if (kind === 'dues' && Number(member.total_due) > 0) {
    return `${greeting} a balance of ${formatMoney(member.total_due)} is pending for your membership at ${gym}. Please clear it on your next visit. Thank you!`;
  }
  const payment = membership?.payments[0];
  if (kind === 'receipt' && membership && payment) {
    return `${greeting} we received ${formatMoney(payment.amount)} on ${formatDate(payment.payment_date.slice(0, 10))} for your ${membership.membership_plan.name} membership at ${gym}, valid till ${formatDate(membership.end_date)}. Thank you!`;
  }
  return null;
}

/** Opens WhatsApp with the message filled in; the admin just taps Send (free, no API needed). */
export function openWhatsApp(phone: string, text: string) {
  return Linking.openURL(`https://wa.me/${whatsappNumber(phone)}?text=${encodeURIComponent(text)}`);
}
