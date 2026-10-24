import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MonthStepper } from '@/components/month-stepper';
import { PaymentMethodPicker } from '@/components/payment-method-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Screen } from '@/components/ui/screen';
import { EmptyState, LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError, type Staff, type StaffSalary } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { confirm } from '@/lib/confirm';
import { formatDate } from '@/lib/dates';
import { monthRange } from '@/lib/expenses';
import { formatMoney, memberName } from '@/lib/format';
import { paymentMethodLabel } from '@/lib/payments';

/** Who has been paid this month; paying a salary also records it as an expense. */
export default function StaffSalariesScreen() {
  const theme = useTheme();
  const { account } = useBusiness();
  const [offset, setOffset] = useState(0);
  const range = monthRange(offset);

  const fetchMonth = useCallback(() => api.staffSalaries(account.id, range.month), [account.id, range.month]);
  const { data, error, refreshing, refresh, retry } = useResource(fetchMonth);

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <MonthStepper label={range.label} offset={offset} onChange={setOffset} />
      {!data ? (
        <LoadingState error={error} onRetry={retry} />
      ) : (
        <>
          {error ? <ErrorBanner message={error} /> : null}
          <View style={styles.totals}>
            <View style={[styles.total, { backgroundColor: theme.successSoft }]}>
              <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Paid</Text>
              <Text style={[styles.totalValue, { color: theme.success }]}>{formatMoney(data.paid)}</Text>
            </View>
            <View style={[styles.total, { backgroundColor: theme.warningSoft }]}>
              <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Still to pay</Text>
              <Text style={[styles.totalValue, { color: theme.warning }]}>{formatMoney(data.pending)}</Text>
            </View>
          </View>
          {data.results.length === 0 ? (
            <EmptyState
              icon="staff"
              title="No staff yet"
              message="Add your staff with their monthly salary to track what you pay them."
              action={
                <Button
                  title="Add Staff"
                  icon="personAdd"
                  onPress={() => router.push({ pathname: '/business/[id]/staff/new', params: { id: account.id } })}
                />
              }
            />
          ) : (
            data.results.map((row) => (
              <SalaryRow key={row.staff.id} staff={row.staff} salary={row.salary} month={range.month} monthLabel={range.label} onChange={refresh} />
            ))
          )}
        </>
      )}
    </Screen>
  );
}

function SalaryRow({
  staff,
  salary,
  month,
  monthLabel,
  onChange,
}: {
  staff: Staff;
  salary: StaffSalary | null;
  month: string;
  monthLabel: string;
  onChange: () => Promise<void>;
}) {
  const theme = useTheme();
  const { account } = useBusiness();
  const [paying, setPaying] = useState(false);
  const [amount, setAmount] = useState(staff.salary ? String(Number(staff.salary)) : '');
  const [method, setMethod] = useState('CASH');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function pay() {
    if (!(Number(amount) > 0)) {
      setError('Enter the amount paid.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.paySalary(account.id, { staff_id: staff.id, salary_month: month, amount: Number(amount).toFixed(2), payment_method: method });
      setPaying(false);
      await onChange();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setError(Object.values(e.fieldErrors)[0] || e.message);
    } finally {
      setBusy(false);
    }
  }

  async function undo() {
    if (!salary) return;
    const ok = await confirm('Undo salary?', `The ${formatMoney(salary.amount)} paid to ${memberName(staff)} and its expense will be removed.`, 'Undo');
    if (!ok) return;
    setBusy(true);
    try {
      await api.undoSalary(account.id, salary.id);
      await onChange();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title={memberName(staff)}
      subtitle={[staff.role, staff.salary ? `${formatMoney(staff.salary)} a month` : 'No salary set'].filter(Boolean).join(' · ')}>
      {error ? <ErrorBanner message={error} /> : null}
      {salary ? (
        <View style={styles.paidRow}>
          <Text style={[styles.paid, { color: theme.success }]}>
            Paid {formatMoney(salary.amount)}
            {salary.paid_on ? ` on ${formatDate(salary.paid_on)}` : ''}
            {salary.payment_method ? ` · ${paymentMethodLabel(salary.payment_method)}` : ''}
          </Text>
          <Button title="Undo" variant="secondary" loading={busy} onPress={undo} style={styles.undo} />
        </View>
      ) : paying ? (
        <>
          <TextField
            label={`Paid for ${monthLabel} (₹)`}
            icon="rupee"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={(text) => setAmount(text.replace(/[^\d.]/g, ''))}
          />
          <PaymentMethodPicker value={method} onChange={setMethod} />
          <View style={styles.buttons}>
            <View style={styles.flex}>
              <Button title="Cancel" variant="secondary" onPress={() => setPaying(false)} />
            </View>
            <View style={styles.flex}>
              <Button title="Save" icon="check" loading={busy} onPress={pay} />
            </View>
          </View>
        </>
      ) : (
        <Button title={staff.salary ? `Pay ${formatMoney(staff.salary)}` : 'Pay Salary'} icon="money" variant="secondary" onPress={() => setPaying(true)} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  totals: {
    flexDirection: 'row',
    gap: Spacing.three - 4,
  },
  total: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    gap: 2,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  paidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  paid: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  undo: {
    paddingHorizontal: Spacing.three,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
  },
});
