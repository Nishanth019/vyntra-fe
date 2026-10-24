import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { PaymentMethodPicker } from '@/components/payment-method-picker';
import { TenantSummary } from '@/components/pg/tenant-summary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateField } from '@/components/ui/date-field';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useTenant } from '@/hooks/use-tenant';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError, type PgCheckoutPreview, type PgTenantProfile } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { confirm } from '@/lib/confirm';
import { isValidISODate, toISODate } from '@/lib/dates';
import { formatMoney, memberName } from '@/lib/format';

export default function CheckoutScreen() {
  const { data: tenant, error, retry } = useTenant();
  if (!tenant) return <LoadingState error={error} onRetry={retry} />;
  return <CheckoutForm tenant={tenant} />;
}

function CheckoutForm({ tenant }: { tenant: PgTenantProfile }) {
  const theme = useTheme();
  const { account } = useBusiness();
  const tenancy = tenant.tenancy!;
  const [leaveDate, setLeaveDate] = useState(
    tenancy.expected_end_date && tenancy.expected_end_date <= toISODate(new Date()) ? tenancy.expected_end_date : toISODate(new Date()),
  );
  const [prorate, setProrate] = useState(false);
  const [preview, setPreview] = useState<PgCheckoutPreview | null>(null);
  const [fromDeposit, setFromDeposit] = useState(true);
  const [deduction, setDeduction] = useState('');
  const [deductionReason, setDeductionReason] = useState('');
  const [method, setMethod] = useState('CASH');
  const [errors, setErrors] = useState<{ deduction?: string; deduction_reason?: string }>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // What's owed and held on the chosen date, without changing anything yet.
  useEffect(() => {
    if (!isValidISODate(leaveDate)) return;
    let cancelled = false;
    api.pgCheckoutPreview(account.id, tenant.id, leaveDate, prorate).then(
      (result) => !cancelled && setPreview(result),
      (e) => {
        if (!(e instanceof ApiError)) throw e;
        if (!cancelled) setFormError(e.message);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [account.id, tenant.id, leaveDate, prorate]);

  const dues = Number(preview?.dues ?? 0);
  const held = Number(preview?.deposit_held ?? 0);
  const advance = Number(preview?.advance ?? 0);
  const kept = Number(deduction || 0);
  const usedForDues = fromDeposit ? Math.min(dues, Math.max(held - kept, 0)) : 0;
  const refund = Math.max(held - kept - usedForDues, 0) + advance;
  const stillDue = dues - usedForDues;

  async function submit() {
    const next: typeof errors = {};
    if (kept > held) next.deduction = `Only ${formatMoney(held)} of the deposit is held.`;
    if (kept > 0 && !deductionReason.trim()) next.deduction_reason = 'Say why the money is kept.';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    const ok = await confirm(
      'Check out tenant?',
      `${memberName(tenant)} moves out on ${leaveDate} and the bed becomes free.` +
        (refund > 0 ? ` Give back ${formatMoney(refund)}.` : '') +
        (stillDue > 0 ? ` ${formatMoney(stillDue)} will still be due.` : ''),
      'Check Out',
    );
    if (!ok) return;

    setSubmitting(true);
    try {
      await api.pgTenantAction(account.id, {
        action: 'checkout',
        member_id: tenant.id,
        leave_date: leaveDate,
        prorate_last_bill: prorate,
        dues_from_deposit: fromDeposit,
        refund_method: method,
        ...(kept > 0 ? { deduction: kept.toFixed(2), deduction_reason: deductionReason.trim() } : {}),
      });
      router.back();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setErrors(e.fieldErrors);
      setFormError(e.message || Object.values(e.fieldErrors)[0] || '');
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      {formError ? <ErrorBanner message={formError} /> : null}
      <TenantSummary tenant={tenant} />

      <Card title="Leaving">
        <DateField label="Leaving Date" required value={leaveDate} onChange={setLeaveDate} maximumDate={new Date()} />
        <SwitchRow
          title="Charge only the days stayed this month"
          hint="Off: the current bill stays as it is."
          value={prorate}
          onChange={setProrate}
        />
      </Card>

      <Card title="Settle Up" subtitle={preview ? undefined : 'Working it out...'}>
        <Line label="Rent still due" value={formatMoney(dues)} tone={dues > 0 ? 'danger' : undefined} />
        <Line label="Deposit held" value={formatMoney(held)} />
        {advance > 0 ? <Line label="Rent paid ahead" value={formatMoney(advance)} /> : null}
        {dues > 0 && held > 0 ? (
          <SwitchRow title="Take the dues from the deposit" value={fromDeposit} onChange={setFromDeposit} />
        ) : null}
        {held > 0 ? (
          <>
            <TextField
              label="Keep From Deposit (₹)"
              placeholder="0, e.g. for damage"
              keyboardType="decimal-pad"
              value={deduction}
              onChangeText={(text) => setDeduction(text.replace(/[^\d.]/g, ''))}
              error={errors.deduction}
            />
            {kept > 0 ? (
              <TextField
                label="Why"
                required
                placeholder="e.g. Broken cupboard"
                value={deductionReason}
                onChangeText={setDeductionReason}
                error={errors.deduction_reason}
              />
            ) : null}
          </>
        ) : null}
        <View style={[styles.total, { backgroundColor: refund > 0 ? theme.successSoft : theme.primarySoft }]}>
          <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Give back to the tenant</Text>
          <Text style={[styles.totalValue, { color: refund > 0 ? theme.success : theme.text }]}>{formatMoney(refund)}</Text>
          {stillDue > 0 ? (
            <Text style={[styles.totalNote, { color: theme.danger }]}>{formatMoney(stillDue)} will still be due from them.</Text>
          ) : null}
        </View>
        {refund > 0 ? <PaymentMethodPicker value={method} onChange={setMethod} /> : null}
      </Card>

      <Button title="Check Out" icon="logoutDoor" variant="destructive" loading={submitting} disabled={!preview} onPress={submit} />
    </Screen>
  );
}

function SwitchRow({ title, hint, value, onChange }: { title: string; hint?: string; value: boolean; onChange: (value: boolean) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.switchRow}>
      <View style={styles.flex}>
        <Text style={[styles.switchTitle, { color: theme.text }]}>{title}</Text>
        {hint ? <Text style={[styles.hint, { color: theme.textSecondary }]}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: theme.primary, false: theme.border }} thumbColor={theme.onPrimary} />
    </View>
  );
}

function Line({ label, value, tone }: { label: string; value: string; tone?: 'danger' }) {
  const theme = useTheme();
  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.lineValue, { color: tone ? theme[tone] : theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 13,
    marginTop: 2,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lineLabel: {
    fontSize: 15,
  },
  lineValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  total: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    gap: 2,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 26,
    fontWeight: '800',
  },
  totalNote: {
    fontSize: 13,
    fontWeight: '600',
  },
});
