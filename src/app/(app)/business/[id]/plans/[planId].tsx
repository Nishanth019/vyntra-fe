import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

import { PlanForm } from '@/components/plan-form';
import { LoadingState } from '@/components/ui/states';
import { useResource } from '@/hooks/use-resource';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';

export default function EditPlanScreen() {
  const { account } = useBusiness();
  const planId = Number(useLocalSearchParams<{ planId: string }>().planId);

  const fetchPlan = useCallback(() => api.plan(account.id, planId), [account.id, planId]);
  const { data: plan, error, retry } = useResource(fetchPlan);

  if (!plan) return <LoadingState error={error} onRetry={retry} />;

  return (
    <PlanForm
      plan={plan}
      onSubmit={async (input) => {
        await api.updatePlan(account.id, planId, input);
        router.back();
      }}
    />
  );
}
