import { router } from 'expo-router';
import { useState } from 'react';

import { TenantSummary } from '@/components/pg/tenant-summary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { useTenant } from '@/hooks/use-tenant';
import { api, ApiError, type PgTenantProfile } from '@/lib/api';
import { useBusiness } from '@/lib/business';

export default function AddChargeScreen() {
  const { data: tenant, error, retry } = useTenant();
  if (!tenant) return <LoadingState error={error} onRetry={retry} />;
  return <ChargeForm tenant={tenant} />;
}

function ChargeForm({ tenant }: { tenant: PgTenantProfile }) {
  const { account } = useBusiness();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<{ description?: string; amount?: string }>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const next: typeof errors = {};
    if (!description.trim()) next.description = 'Say what the charge is for.';
    if (!(Number(amount) > 0)) next.amount = 'Enter the amount.';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    setSubmitting(true);
    try {
      await api.pgAddCharge(account.id, { member_id: tenant.id, description: description.trim(), amount: Number(amount).toFixed(2) });
      router.back();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setErrors(e.fieldErrors);
      setFormError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      {formError ? <ErrorBanner message={formError} /> : null}
      <TenantSummary tenant={tenant} />
      <Card title="Add a Charge" subtitle="Added to this month's bill, e.g. electricity, laundry or a damage.">
        <TextField
          label="For"
          required
          icon="document"
          placeholder="e.g. Electricity for October"
          value={description}
          onChangeText={setDescription}
          error={errors.description}
        />
        <TextField
          label="Amount (₹)"
          required
          icon="rupee"
          placeholder="0"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={(text) => setAmount(text.replace(/[^\d.]/g, ''))}
          error={errors.amount}
        />
      </Card>
      <Button title="Add Charge" icon="add" loading={submitting} onPress={submit} />
    </Screen>
  );
}
