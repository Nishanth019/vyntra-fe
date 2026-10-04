import { router } from 'expo-router';

import { PlanForm } from '@/components/plan-form';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';

export default function NewPlanScreen() {
  const { account } = useBusiness();

  return (
    <PlanForm
      onSubmit={async (input) => {
        await api.createPlan(account.id, input);
        router.back();
      }}
    />
  );
}
