import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { PaymentMethodPicker } from '@/components/payment-method-picker';
import { TenantSummary } from '@/components/pg/tenant-summary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { useTenant } from '@/hooks/use-tenant';
import { api, ApiError, type PgDepositEntry, type PgTenantProfile } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { formatMoney } from '@/lib/format';

type EntryType = PgDepositEntry['entry_type'];

export default function DepositScreen() {
  const { data: tenant, error, retry } = useTenant();
  const { type } = useLocalSearchParams<{ type?: EntryType }>();
  if (!tenant) return <LoadingState error={error} onRetry={retry} />;
  return <DepositForm tenant={tenant} initialType={type ?? 'COLLECT'} />;
}

function DepositForm({ tenant, initialType }: { tenant: PgTenantProfile; initialType: EntryType }) {
  const { account } = useBusiness();
  const deposit = tenant.deposit!;
  const [type, setType] = useState<EntryType>(initialType);
  const limit = Number(type === 'COLLECT' ? deposit.pending : deposit.held);
  const [amount, setAmount] = useState(limit > 0 ? String(limit) : '');
  const [method, setMethod] = useState('CASH');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; reason?: string }>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function changeType(next: EntryType) {
    setType(next);
    const nextLimit = Number(next === 'COLLECT' ? deposit.pending : deposit.held);
    setAmount(nextLimit > 0 ? String(nextLimit) : '');
    setErrors({});
  }

  async function submit() {
    const next: typeof errors = {};
    if (!(Number(amount) > 0)) next.amount = 'Enter the amount.';
    else if (Number(amount) > limit) next.amount = `Up to ${formatMoney(limit)}.`;
    if (type === 'DEDUCT' && !reason.trim()) next.reason = 'Say why the money is kept.';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    setSubmitting(true);
    try {
      await api.pgDeposit(account.id, {
        member_id: tenant.id,
        entry_type: type,
        amount: Number(amount).toFixed(2),
        ...(type === 'DEDUCT' ? {} : { payment_method: method }),
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
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
      <Segmented
        options={[
          { key: 'COLLECT', label: 'Collect' },
          { key: 'REFUND', label: 'Refund' },
          { key: 'DEDUCT', label: 'Keep' },
        ]}
        value={type}
        onChange={changeType}
      />
      <Card
        title={type === 'COLLECT' ? 'Collect Deposit' : type === 'REFUND' ? 'Refund Deposit' : 'Keep From Deposit'}
        subtitle={
          type === 'COLLECT'
            ? `${formatMoney(deposit.pending)} still to collect of ${formatMoney(deposit.agreed)}.`
            : `${formatMoney(deposit.held)} held. ${type === 'DEDUCT' ? 'Kept money counts as income.' : ''}`
        }>
        <TextField
          label="Amount (₹)"
          icon="rupee"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={(text) => setAmount(text.replace(/[^\d.]/g, ''))}
          error={errors.amount}
        />
        {type === 'DEDUCT' ? (
          <TextField label="Why" required placeholder="e.g. Broken cupboard" value={reason} onChangeText={setReason} error={errors.reason} />
        ) : (
          <PaymentMethodPicker value={method} onChange={setMethod} />
        )}
      </Card>
      <Button title="Save" icon="check" loading={submitting} onPress={submit} />
    </Screen>
  );
}
