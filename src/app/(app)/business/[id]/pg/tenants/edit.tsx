import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

import { TenantForm } from '@/components/pg/tenant-form';
import { LoadingState } from '@/components/ui/states';
import { useResource } from '@/hooks/use-resource';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';

export default function EditTenantScreen() {
  const { account } = useBusiness();
  const memberId = Number(useLocalSearchParams<{ memberId: string }>().memberId);

  const fetchTenant = useCallback(() => api.pgTenant(account.id, memberId), [account.id, memberId]);
  const { data: tenant, error, retry } = useResource(fetchTenant);

  if (!tenant) return <LoadingState error={error} onRetry={retry} />;

  return (
    <TenantForm
      tenant={tenant}
      rooms={[]}
      settings={null}
      onSubmit={async (input) => {
        if (Object.keys(input).length) await api.updatePgTenant(account.id, tenant.id, input);
        router.back();
      }}
    />
  );
}
