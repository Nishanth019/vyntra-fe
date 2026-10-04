import { router } from 'expo-router';
import { useCallback } from 'react';

import { MemberForm } from '@/components/member-form';
import { LoadingState } from '@/components/ui/states';
import { useResource } from '@/hooks/use-resource';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';

export default function NewMemberScreen() {
  const { account } = useBusiness();

  const fetchFormData = useCallback(async () => {
    const [plans, latest] = await Promise.all([
      api.plans(account.id),
      api.members({ business_account_id: account.id }),
    ]);
    // Suggest the next number after the newest member's ID when IDs are numeric.
    const lastCode = latest.results[0]?.member_code;
    const suggestedCode = !lastCode ? '1' : /^\d+$/.test(lastCode) ? String(Number(lastCode) + 1) : '';
    return { plans: plans.results.filter((plan) => plan.is_active), suggestedCode };
  }, [account.id]);
  const { data, error, retry } = useResource(fetchFormData);

  if (!data) return <LoadingState error={error} onRetry={retry} />;

  return (
    <MemberForm
      plans={data.plans}
      suggestedCode={data.suggestedCode}
      onSubmit={async (input) => {
        await api.createMember(account.id, input);
        router.back();
      }}
    />
  );
}
