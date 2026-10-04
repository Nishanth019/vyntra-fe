import { router } from 'expo-router';

import { StaffForm } from '@/components/staff-form';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';

export default function NewStaffScreen() {
  const { account } = useBusiness();

  return (
    <StaffForm
      onSubmit={async (input) => {
        await api.createStaff(account.id, input);
        router.back();
      }}
    />
  );
}
