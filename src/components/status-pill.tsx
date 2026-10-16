import { StyleSheet, Text, View } from 'react-native';

import { useToneColors, type Tone } from '@/components/ui/icon-badge';
import { Radius, Spacing } from '@/constants/theme';
import type { Member } from '@/lib/api';
import { daysUntil, formatDate } from '@/lib/dates';

/** Where a member's membership stands today, e.g. "Expired" or "3 days left". */
export function membershipStatus(member: Member): { label: string; tone: Tone } {
  if (member.status === 'inactive') return { label: 'Inactive', tone: 'neutral' };
  if (member.status === 'no_plan' || !member.membership) return { label: 'No plan', tone: 'neutral' };
  if (member.status === 'expired') return { label: 'Expired', tone: 'danger' };
  if (member.status === 'upcoming') {
    return { label: `Starts ${formatDate(member.membership.start_date)}`, tone: 'accent' };
  }

  // Live. For an early renewal the active membership is the next one, so this counts to its end.
  const days = daysUntil(member.membership.end_date);
  if (days === 0) return { label: 'Ends today', tone: 'warning' };
  if (days <= 7) return { label: `${days} day${days === 1 ? '' : 's'} left`, tone: 'warning' };
  return { label: `Till ${formatDate(member.membership.end_date)}`, tone: 'success' };
}

export function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  const { color, background } = useToneColors(tone);

  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      <Text style={[styles.text, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
