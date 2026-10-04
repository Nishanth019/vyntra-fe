import { router } from 'expo-router';
import { useState } from 'react';

import { OrganisationForm } from '@/components/organisation-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { api, ApiError } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { confirm } from '@/lib/confirm';

export default function OrganisationSettingsScreen() {
  const { account, setAccount } = useBusiness();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function deleteOrganisation() {
    const ok = await confirm(
      'Delete organisation?',
      `${account.name} will be removed from your organisations. Its members and records are kept but no longer shown.`,
      'Delete',
    );
    if (!ok) return;

    setDeleting(true);
    setDeleteError('');
    try {
      await api.deleteBusinessAccount(account.id);
      router.dismissTo('/');
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setDeleteError(e.message);
      setDeleting(false);
    }
  }

  return (
    <OrganisationForm
      account={account}
      submitLabel="Save Changes"
      onSubmit={async (input) => {
        setAccount(await api.updateBusinessAccount(account.id, input));
        router.back();
      }}
      footer={
        <Card icon="warning" title="Danger Zone" subtitle="Remove this organisation from Vyntra." tone="danger">
          {deleteError ? <ErrorBanner message={deleteError} /> : null}
          <Button
            title="Delete Organisation"
            icon="block"
            variant="danger"
            loading={deleting}
            onPress={deleteOrganisation}
          />
        </Card>
      }
    />
  );
}
