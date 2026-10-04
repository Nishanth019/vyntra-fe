import { router } from 'expo-router';

import { AdminForm } from '@/components/admin-form';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';

export default function NewAdminScreen() {
  const { account } = useBusiness();

  return (
    <AdminForm
      onSubmit={async (input) => {
        await api.createAdmin(account.id, input);
        router.back();
      }}
    />
  );
}
