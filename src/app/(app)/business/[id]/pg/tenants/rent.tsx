import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { PaymentMethodPicker } from '@/components/payment-method-picker';
import { TenantSummary } from '@/components/pg/tenant-summary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateField } from '@/components/ui/date-field';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { useTenant } from '@/hooks/use-tenant';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError, type PgTenantProfile } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { isValidISODate, toISODate } from '@/lib/dates';
import { formatMoney } from '@/lib/format';

export default function RecordRentScreen() {
  const { data: tenant, error, retry } = useTenant();
  if (!tenant) return <LoadingState error={error} onRetry={retry} />;
  return <RentForm tenant={tenant} />;
}

function RentForm({ tenant }: { tenant: PgTenantProfile }) {
  const theme = useTheme();
  const { account } = useBusiness();
  const today = toISODate(new Date());
  const due = Number(tenant.total_due);
  const [amount, setAmount] = useState(due > 0 ? String(due) : '');
  const [method, setMethod] = useState('CASH');
  const [date, setDate] = useState(today);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; date?: string }>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const next: typeof errors = {};
    if (!(Number(amount) > 0)) next.amount = 'Enter the amount received.';
    if (!isValidISODate(date)) next.date = 'Choose the payment date.';
    else if (date > today) next.date = "Payment date can't be in the future.";
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await api.pgRecordRent(account.id, {
        member_id: tenant.id,
        amount: Number(amount).toFixed(2),
        payment_method: method,
        payment_date: `${date}T00:00:00Z`,
        ...(reference.trim() ? { transaction_reference: reference.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      router.back();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setErrors({ amount: e.fieldErrors.amount, date: e.fieldErrors.payment_date });
      setFormError(e.message);
      setSubmitting(false);
    }
  }

  const extra = Number(amount) - due;

  return (
    <Screen>
      {formError ? <ErrorBanner message={formError} /> : null}
      <TenantSummary tenant={tenant} />
      <Card>
        <TextField
          label="Amount Received (₹)"
          icon="rupee"
          placeholder="0"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={(text) => {
            setAmount(text.replace(/[^\d.]/g, ''));
            setErrors((current) => ({ ...current, amount: undefined }));
          }}
          error={errors.amount}
        />
        <Text style={[styles.note, { color: extra > 0 ? theme.success : theme.textSecondary }]}>
          {extra > 0
            ? `${formatMoney(extra)} more than what's due is kept as advance for the next bill.`
            : 'Pays the oldest unpaid bill first.'}
        </Text>
        <PaymentMethodPicker value={method} onChange={setMethod} />
        <DateField
          label="Payment Date"
          value={date}
          onChange={(value) => {
            setDate(value);
            setErrors((current) => ({ ...current, date: undefined }));
          }}
          error={errors.date}
          maximumDate={new Date()}
        />
        <TextField
          label="Transaction Reference (Optional)"
          icon="document"
          placeholder="e.g. UPI ref, cheque no."
          autoCapitalize="characters"
          value={reference}
          onChangeText={setReference}
        />
        <TextField label="Notes (Optional)" placeholder="Add any notes here..." multiline maxLength={200} value={notes} onChangeText={setNotes} />
      </Card>
      <Button title="Record Rent" icon="checkCircle" loading={submitting} onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: {
    fontSize: 13,
    marginTop: -4,
  },
});
