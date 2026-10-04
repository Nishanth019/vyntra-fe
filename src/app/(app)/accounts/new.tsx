import { router, useLocalSearchParams } from 'expo-router';

import { OrganisationForm } from '@/components/organisation-form';
import { api } from '@/lib/api';

export default function NewAccountScreen() {
  const { typeId } = useLocalSearchParams<{ typeId: string }>();

  return (
    <OrganisationForm
      submitLabel="Submit"
      onSubmit={async (input) => {
        const account = await api.createBusinessAccount({ ...input, business_type_id: Number(typeId) });
        router.replace({ pathname: '/business/[id]', params: { id: account.id } });
      }}
    />
  );
}
