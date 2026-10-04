import { router, Stack } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/ui/error-banner';
import { HeaderButton } from '@/components/ui/header-button';
import { Icon } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/icon-badge';
import { Screen } from '@/components/ui/screen';
import { EmptyState, LoadingState } from '@/components/ui/states';
import { Radius, Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api, type MembershipPlan } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { formatDuration, formatMoney } from '@/lib/format';

export default function PlansScreen() {
  const { account } = useBusiness();
  const params = { id: account.id };

  // A business has a handful of plans, so the first page (20) covers them.
  const fetchPlans = useCallback(() => api.plans(account.id).then(({ results }) => results), [account.id]);
  const { data: plans, error, refreshing, refresh, retry } = useResource(fetchPlans);

  const addPlan = () => router.push({ pathname: '/business/[id]/plans/new', params });

  return (
    <>
      <Stack.Screen options={{ headerRight: () => <HeaderButton icon="add" label="Add plan" onPress={addPlan} /> }} />
      {!plans ? (
        <LoadingState error={error} onRetry={retry} />
      ) : (
        <Screen onRefresh={refresh} refreshing={refreshing}>
          {error ? <ErrorBanner message={error} /> : null}
          {plans.length === 0 ? (
            <EmptyState
              icon="plans"
              title="No plans yet"
              message="Create your first membership plan. You'll need one to add members."
              action={<Button title="Add Plan" icon="add" onPress={addPlan} />}
            />
          ) : (
            <View style={styles.list}>
              {plans.map((plan) => (
                <PlanRow
                  key={plan.id}
                  plan={plan}
                  onPress={() =>
                    router.push({ pathname: '/business/[id]/plans/[planId]', params: { ...params, planId: plan.id } })
                  }
                />
              ))}
            </View>
          )}
        </Screen>
      )}
    </>
  );
}

function PlanRow({ plan, onPress }: { plan: MembershipPlan; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.surface, borderColor: theme.border },
        !plan.is_active && styles.inactive,
        pressed && styles.pressed,
      ]}>
      <IconBadge name="plans" tone={plan.is_active ? 'accent' : 'neutral'} />
      <View style={styles.body}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {plan.name}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          {formatDuration(plan.duration_value, plan.duration_type)}
          {plan.is_active ? '' : ' · Inactive'}
        </Text>
      </View>
      <Text style={[styles.amount, { color: theme.text }]}>{formatMoney(plan.amount)}</Text>
      <Icon name="chevronRight" color={theme.textSecondary} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
  inactive: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.7,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    fontSize: 14,
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
  },
});
