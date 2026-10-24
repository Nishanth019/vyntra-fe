import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

import { TenantForm } from '@/components/pg/tenant-form';
import { LoadingState } from '@/components/ui/states';
import { useResource } from '@/hooks/use-resource';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';

export default function NewTenantScreen() {
  const { account } = useBusiness();
  const { bedId } = useLocalSearchParams<{ bedId?: string }>();

  const fetchData = useCallback(
    () => Promise.all([api.pgRooms(account.id), api.pgSettings(account.id)]),
    [account.id],
  );
  const { data, error, retry } = useResource(fetchData);

  if (!data) return <LoadingState error={error} onRetry={retry} />;
  const [rooms, settings] = data;

  return (
    <TenantForm
      rooms={rooms.results}
      settings={settings}
      bedId={bedId ? Number(bedId) : undefined}
      onSubmit={async (input) => {
        const tenant = await api.createPgTenant(account.id, input);
        router.replace({ pathname: '/business/[id]/pg/tenants/[memberId]', params: { id: account.id, memberId: tenant.id } });
      }}
    />
  );
}
