import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MembershipPlan } from '@/lib/api';
import { formatDuration, formatMoney } from '@/lib/format';

type PlanOptionsProps = {
  plans: MembershipPlan[];
  value: number | null;
  onChange: (planId: number) => void;
};

/** Plans to choose from, two per row: radio, name, duration and price. */
export function PlanOptions({ plans, value, onChange }: PlanOptionsProps) {
  const rows: MembershipPlan[][] = [];
  for (let i = 0; i < plans.length; i += 2) rows.push(plans.slice(i, i + 2));

  return (
    <View style={styles.grid}>
      {rows.map((row) => (
        <View key={row[0].id} style={styles.row}>
          {row.map((plan) => (
            <PlanOption key={plan.id} plan={plan} selected={plan.id === value} onPress={() => onChange(plan.id)} />
          ))}
          {row.length === 1 ? <View style={styles.flex} /> : null}
        </View>
      ))}
    </View>
  );
}

function PlanOption({ plan, selected, onPress }: { plan: MembershipPlan; selected: boolean; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected
          ? { backgroundColor: theme.primarySoft, borderColor: theme.primary }
          : { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.radio, { borderColor: selected ? theme.primary : theme.border }]}>
        {selected ? <View style={[styles.radioDot, { backgroundColor: theme.primary }]} /> : null}
      </View>
      <View style={styles.flex}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {plan.name}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
          {formatDuration(plan.duration_value, plan.duration_type)}
        </Text>
        <Text style={[styles.amount, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
          {formatMoney(plan.amount)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: Spacing.three - 4,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three - 4,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.two + 2,
    padding: Spacing.three - 2,
    borderWidth: 1.5,
    borderRadius: Radius.md,
  },
  pressed: {
    opacity: 0.75,
  },
  radio: {
    width: 22,
    height: 22,
    marginTop: 1,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    fontSize: 13,
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: Spacing.one,
  },
  flex: {
    flex: 1,
  },
});
