import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

import { StaffForm } from '@/components/staff-form';
import { LoadingState } from '@/components/ui/states';
import { useResource } from '@/hooks/use-resource';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { memberName } from '@/lib/format';

export default function EditStaffScreen() {
  const { account } = useBusiness();
  const staffId = Number(useLocalSearchParams<{ staffId: string }>().staffId);

  const fetchStaff = useCallback(() => api.staff(account.id, staffId), [account.id, staffId]);
  const { data: staff, error, retry } = useResource(fetchStaff);

  if (!staff) return <LoadingState error={error} onRetry={retry} />;

  return (
    <>
      <Stack.Screen options={{ title: memberName(staff) }} />
      <StaffForm
        staff={staff}
        onSubmit={async (input) => {
          await api.updateStaff(account.id, staffId, input);
          router.back();
        }}
      />
    </>
  );
}
