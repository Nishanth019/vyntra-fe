import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

import { AdminForm } from '@/components/admin-form';
import { LoadingState } from '@/components/ui/states';
import { useResource } from '@/hooks/use-resource';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { useSession } from '@/lib/session';

export default function EditAdminScreen() {
  const { account } = useBusiness();
  const { admin: me, updateAdmin } = useSession();
  const adminId = Number(useLocalSearchParams<{ adminId: string }>().adminId);

  const fetchAdmin = useCallback(() => api.admin(account.id, adminId), [account.id, adminId]);
  const { data: accountAdmin, error, retry } = useResource(fetchAdmin);

  if (!accountAdmin) return <LoadingState error={error} onRetry={retry} />;
  const isSelf = adminId === me?.id;

  return (
    <AdminForm
      accountAdmin={accountAdmin}
      isSelf={isSelf}
      onSubmit={async (input) => {
        const updated = await api.updateAdmin(account.id, adminId, input);
        // Keep the signed-in profile in sync when editing yourself.
        if (isSelf) updateAdmin(updated.admin);
        router.back();
      }}
      onSetPassword={(password) => api.setAdminPassword(account.id, adminId, password).then(() => {})}
      onRemove={async () => {
        await api.removeAdmin(account.id, adminId);
        router.back();
      }}
    />
  );
}
