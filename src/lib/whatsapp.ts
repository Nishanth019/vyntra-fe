import { Linking } from 'react-native';

import type { Member } from '@/lib/api';
import { formatDate } from '@/lib/dates';
import { formatMoney } from '@/lib/format';

/** Days from today to an ISO date (negative when it's past). */
function daysUntil(isoDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${isoDate}T00:00:00`).getTime() - today.getTime()) / 86_400_000);
}

/** A ready-to-send message for this member: dues first, then a plan ending or ended, else a plain hello. */
export function memberMessage(member: Member, gymName: string) {
  const name = member.first_name.trim().split(' ')[0];
  const plan = member.membership;
  if (Number(member.total_due) > 0) {
    return `Hi ${name}, a payment of ${formatMoney(member.total_due)} is pending for your membership at ${gymName}. Please clear it on your next visit. Thank you!`;
  }
  if (plan) {
    const left = daysUntil(plan.end_date);
    const ends = formatDate(plan.end_date);
    if (left < 0) {
      return `Hi ${name}, your ${plan.membership_plan.name} membership at ${gymName} ended on ${ends}. We miss you! Visit us to renew and get back on track.`;
    }
    if (left <= 7) {
      return `Hi ${name}, your ${plan.membership_plan.name} membership at ${gymName} ends on ${ends}. Renew to keep training without a break.`;
    }
  }
  return `Hi ${name}, `;
}

/** Opens WhatsApp with a chat to the member and the message typed in, ready to send. */
export function openWhatsApp(phone: string, message: string) {
  return Linking.openURL(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`);
}
