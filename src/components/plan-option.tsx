import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MembershipPlan } from '@/lib/api';
import { formatDuration, formatMoney } from '@/lib/format';

/** A selectable plan row: name, duration and price. */
export function PlanOption({ plan, selected, onPress }: { plan: MembershipPlan; selected: boolean; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.planOption,
        selected
          ? { backgroundColor: theme.primarySoft, borderColor: theme.primary }
          : { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View
        style={[
          styles.radio,
          { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primary : 'transparent' },
        ]}>
        {selected ? <Icon name="check" color={theme.onPrimary} size={14} /> : null}
      </View>
      <View style={styles.flex}>
        <Text style={[styles.planName, { color: theme.text }]}>{plan.name}</Text>
        <Text style={[styles.planMeta, { color: theme.textSecondary }]}>
          {formatDuration(plan.duration_value, plan.duration_type)}
        </Text>
      </View>
      <Text style={[styles.planAmount, { color: theme.text }]}>{formatMoney(plan.amount)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  planOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1.5,
    borderRadius: Radius.md,
  },
  pressed: {
    opacity: 0.75,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
  },
  planMeta: {
    fontSize: 13,
  },
  planAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  flex: {
    flex: 1,
  },
});
