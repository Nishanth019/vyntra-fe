import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { TenantSummary } from '@/components/pg/tenant-summary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Screen } from '@/components/ui/screen';
import { EmptyState, LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { useTenant } from '@/hooks/use-tenant';
import { api, ApiError, type PgBill, type PgTenantProfile } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { formatMoney } from '@/lib/format';
import { billTitle } from '@/lib/pg';

export default function BillDiscountScreen() {
  const { data: tenant, error, retry } = useTenant();
  const billId = Number(useLocalSearchParams<{ billId: string }>().billId);
  if (!tenant) return <LoadingState error={error} onRetry={retry} />;
  const bill = tenant.bills.find((item) => item.id === billId);
  if (!bill) return <EmptyState icon="receipt" title="Bill not found" />;
  return <DiscountForm tenant={tenant} bill={bill} />;
}

function DiscountForm({ tenant, bill }: { tenant: PgTenantProfile; bill: PgBill }) {
  const { account } = useBusiness();
  const [discount, setDiscount] = useState(Number(bill.discount) > 0 ? String(Number(bill.discount)) : '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const value = Number(discount || 0);
    if (!(value >= 0) || value > Number(bill.total)) {
      setError(`Enter up to ${formatMoney(bill.total)}.`);
      return;
    }
    setSubmitting(true);
    try {
      await api.pgBillDiscount(account.id, bill.id, value.toFixed(2));
      router.back();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setError(e.fieldErrors.discount || e.message);
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <TenantSummary tenant={tenant} />
      {error ? <ErrorBanner message={error} /> : null}
      <Card title="Discount" subtitle={`Bill for ${billTitle(bill)}, ${formatMoney(bill.total)}. Use 0 to remove it.`}>
        <TextField
          label="Discount (₹)"
          icon="rupee"
          placeholder="0"
          keyboardType="decimal-pad"
          value={discount}
          onChangeText={(text) => setDiscount(text.replace(/[^\d.]/g, ''))}
        />
      </Card>
      <Button title="Save Discount" icon="check" loading={submitting} onPress={submit} />
    </Screen>
  );
}
