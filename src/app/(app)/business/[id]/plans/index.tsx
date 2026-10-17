import { router, Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/ui/error-banner';
import { HeaderButton } from '@/components/ui/header-button';
import { Icon, type IconName } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/icon-badge';
import { Screen } from '@/components/ui/screen';
import { EmptyState, LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { Radius, shadow, Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError, type MembershipPlan } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { formatDuration, formatMoney } from '@/lib/format';

const PLAN_ICONS: IconName[] = ['dumbbell', 'crown', 'calendar', 'trophy'];

export default function PlansScreen() {
  const { account } = useBusiness();
  const params = { id: account.id };
  const [search, setSearch] = useState('');
  const [toggleError, setToggleError] = useState('');

  // A business has a handful of plans, so the first page (20) covers them.
  const fetchPlans = useCallback(() => api.plans(account.id).then(({ results }) => results), [account.id]);
  const { data: plans, setData: setPlans, error, refreshing, refresh, retry } = useResource(fetchPlans);

  const addPlan = () => router.push({ pathname: '/business/[id]/plans/new', params });

  async function setActive(plan: MembershipPlan, is_active: boolean) {
    setToggleError('');
    try {
      const updated = await api.updatePlan(account.id, plan.id, { is_active });
      setPlans((current) => current && current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setToggleError(e.message);
    }
  }

  const query = search.trim().toLowerCase();
  const shown = plans?.filter((plan) => plan.name.toLowerCase().includes(query)) ?? [];

  return (
    <>
      <Stack.Screen options={{ headerRight: () => <HeaderButton icon="add" label="Add plan" filled onPress={addPlan} /> }} />
      {!plans ? (
        <LoadingState error={error} onRetry={retry} />
      ) : (
        <Screen onRefresh={refresh} refreshing={refreshing}>
          {error || toggleError ? <ErrorBanner message={error || toggleError} /> : null}
          {plans.length === 0 ? (
            <EmptyState
              icon="plans"
              title="No plans yet"
              message="Create your first membership plan. You'll need one to add members."
              action={<Button title="Add Plan" icon="add" onPress={addPlan} />}
            />
          ) : (
            <>
              <TextField
                label="Search plans"
                hideLabel
                icon="search"
                placeholder="Search membership plans..."
                value={search}
                onChangeText={setSearch}
              />
              {shown.map((plan, i) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  icon={PLAN_ICONS[i % PLAN_ICONS.length]}
                  onToggle={(value) => setActive(plan, value)}
                  onPress={() =>
                    router.push({ pathname: '/business/[id]/plans/[planId]', params: { ...params, planId: plan.id } })
                  }
                />
              ))}
            </>
          )}
        </Screen>
      )}
    </>
  );
}

type PlanCardProps = {
  plan: MembershipPlan;
  icon: IconName;
  onToggle: (active: boolean) => void;
  onPress: () => void;
};

function PlanCard({ plan, icon, onToggle, onPress }: PlanCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        shadow(theme.shadow),
        pressed && styles.pressed,
      ]}>
      <IconBadge name={icon} tone={plan.is_active ? 'primary' : 'neutral'} size={56} />
      <View style={styles.body}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {plan.name}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          {formatDuration(plan.duration_value, plan.duration_type)}
        </Text>
        <Text style={[styles.amount, { color: plan.is_active ? theme.text : theme.textSecondary }]}>
          {formatMoney(plan.amount)}
        </Text>
      </View>
      <View style={styles.side}>
        <View style={styles.status}>
          <Text style={[styles.statusText, { color: plan.is_active ? theme.success : theme.textSecondary }]}>
            {plan.is_active ? 'Active' : 'Inactive'}
          </Text>
          <Switch
            value={plan.is_active}
            onValueChange={onToggle}
            trackColor={{ true: theme.success, false: theme.border }}
              thumbColor={theme.onPrimary}
            accessibilityLabel={`${plan.name} active`}
          />
        </View>
        <Icon name="chevronRight" color={theme.textSecondary} size={20} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three + 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
  },
  pressed: {
    opacity: 0.7,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 19,
    fontWeight: '800',
  },
  meta: {
    fontSize: 14,
  },
  amount: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: Spacing.one,
  },
  side: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
