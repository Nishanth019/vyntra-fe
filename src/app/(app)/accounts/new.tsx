import { router, useLocalSearchParams } from 'expo-router';

import { OrganisationForm } from '@/components/organisation-form';
import { api } from '@/lib/api';

export default function NewAccountScreen() {
  const { typeId, typeName } = useLocalSearchParams<{ typeId: string; typeName?: string }>();

  return (
    <OrganisationForm
      submitLabel="Create Organisation"
      pg={/pg|hostel/i.test(typeName ?? '')}
      onSubmit={async (input) => {
        const account = await api.createBusinessAccount({ ...input, business_type_id: Number(typeId) });
        router.replace({ pathname: '/business/[id]', params: { id: account.id } });
      }}
    />
  );
}
