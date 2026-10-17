import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import type { PlanMode } from '@/components/membership-card';
import { PlanOption } from '@/components/plan-option';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { DateField } from '@/components/ui/date-field';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError, type Member, type MembershipPlan } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { addDays, formatDate, isValidISODate, parseISODate, toISODate } from '@/lib/dates';
import { formatMoney, memberName } from '@/lib/format';
import { PAYMENT_METHODS } from '@/lib/payments';

const TITLES: Record<PlanMode, string> = {
  renew: 'Renew Membership',
  change: 'Change Plan',
  extend: 'Extend / Freeze',
  edit: 'Edit Membership',
};

const EXTEND_PRESETS = [7, 15, 30];

function isPlanMode(value: unknown): value is PlanMode {
  return value === 'renew' || value === 'change' || value === 'extend' || value === 'edit';
}

/** Renew, change plan, extend or correct a member's membership. */
export default function MembershipPlanScreen() {
  const { account } = useBusiness();
  const params = useLocalSearchParams<{ memberId: string; mode: string }>();
  const memberId = Number(params.memberId);
  const mode: PlanMode = isPlanMode(params.mode) ? params.mode : 'renew';

  const fetchData = useCallback(async () => {
    const [member, plans] = await Promise.all([api.member(account.id, memberId), api.plans(account.id)]);
    return { member, plans: plans.results.filter((plan) => plan.is_active) };
  }, [account.id, memberId]);
  const { data, error, retry } = useResource(fetchData);

  if (!data) return <LoadingState error={error} onRetry={retry} />;

  return (
    <>
      <Stack.Screen options={{ title: TITLES[mode] }} />
      {mode === 'renew' || mode === 'change' ? (
        <NewPlanForm mode={mode} member={data.member} plans={data.plans} />
      ) : (
        <AdjustForm mode={mode} member={data.member} />
      )}
    </>
  );
}

function NewPlanForm({ mode, member, plans }: { mode: 'renew' | 'change'; member: Member; plans: MembershipPlan[] }) {
  const theme = useTheme();
  const { account } = useBusiness();

  const currentPlanId = member.membership?.membership_plan.id ?? null;
  const [planId, setPlanId] = useState<number | null>(mode === 'renew' ? currentPlanId : null);
  const [startDate, setStartDate] = useState(toISODate(new Date()));
  const [discount, setDiscount] = useState('');
  const [recordPayment, setRecordPayment] = useState(true);
  const [payment, setPayment] = useState({ amount: '', method: 'CASH', reference: '' });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const plan = plans.find((item) => item.id === planId);
  const discountValue = Math.min(Number(discount || 0), Number(plan?.amount ?? 0));
  const payable = plan ? Math.max(0, Number(plan.amount) - discountValue) : 0;

  async function save() {
    const next: Record<string, string> = {};
    if (!plan) next.membership_plan_id = 'Choose a plan.';
    if (!isValidISODate(startDate)) next.start_date = 'Choose a start date.';
    if (discount && plan && Number(discount) > Number(plan.amount)) next.discount = "Discount can't exceed the plan amount.";
    const amount = Number(payment.amount || payable);
    if (recordPayment && !(amount > 0)) next.payment_amount = 'Enter the amount received.';
    setErrors(next);
    if (Object.keys(next).length > 0 || !plan) return;

    setSaving(true);
    setFormError('');
    try {
      await api.membershipAction(account.id, {
        action: mode === 'renew' ? 'renew' : 'change_plan',
        member_id: member.id,
        membership_plan_id: plan.id,
        start_date: startDate,
        ...(discount ? { discount: Number(discount).toFixed(2) } : {}),
        ...(recordPayment
          ? {
              payment: {
                amount: amount.toFixed(2),
                payment_method: payment.method,
                ...(payment.reference.trim() ? { transaction_reference: payment.reference.trim() } : {}),
              },
            }
          : {}),
      });
      router.back();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setErrors(e.fieldErrors);
      setFormError(e.message || Object.values(e.fieldErrors)[0] || '');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      {formError ? <ErrorBanner message={formError} /> : null}

      <Card
        icon="plans"
        title={memberName(member)}
        subtitle={
          mode === 'renew'
            ? 'Rejoining: pick their new plan. Earlier plans stay in their history.'
            : 'A completely new plan from the start date. The current plan ends the day before, and only the new plan counts for dues.'
        }>
        <View style={styles.plans}>
          {plans.map((item) => (
            <PlanOption key={item.id} plan={item} selected={item.id === planId} onPress={() => setPlanId(item.id)} />
          ))}
        </View>
        {errors.membership_plan_id ? <Text style={[styles.error, { color: theme.danger }]}>{errors.membership_plan_id}</Text> : null}

        <DateField
          label="Start Date"
          required
          value={startDate}
          onChange={setStartDate}
          error={errors.start_date}
          note={
            mode === 'change' && member.membership
              ? `Current plan (${member.membership.membership_plan.name}) ends the day before.`
              : undefined
          }
        />

        <TextField
          label="Discount (₹)"
          icon="money"
          placeholder="0"
          keyboardType="decimal-pad"
          value={discount}
          onChangeText={(text) => setDiscount(text.replace(/[^\d.]/g, ''))}
          error={errors.discount}
          hint={plan ? ({ text: `Payable ${formatMoney(payable)}`, tone: 'muted' } as const) : undefined}
        />
      </Card>

      <Card
        icon="money"
        title="Payment"
        subtitle={recordPayment ? undefined : 'Turn on to record money received now.'}
        action={
          <Switch
            value={recordPayment}
            onValueChange={setRecordPayment}
            trackColor={{ true: theme.primary, false: theme.border }}
            accessibilityLabel="Record a payment"
          />
        }>
        {recordPayment ? (
          <>
            <TextField
              label="Amount Received (₹)"
              icon="money"
              placeholder={String(payable)}
              keyboardType="decimal-pad"
              value={payment.amount}
              onChangeText={(text) => setPayment((current) => ({ ...current, amount: text.replace(/[^\d.]/g, '') }))}
              error={errors.payment_amount}
            />
            <View style={styles.row}>
              {PAYMENT_METHODS.map((method) => (
                <View key={method.value} style={styles.flex}>
                  <Chip
                    label={method.label}
                    selected={payment.method === method.value}
                    onPress={() => setPayment((current) => ({ ...current, method: method.value }))}
                  />
                </View>
              ))}
            </View>
            <TextField
              label="Transaction Reference"
              icon="document"
              placeholder="UPI / card reference (optional)"
              autoCapitalize="characters"
              value={payment.reference}
              onChangeText={(text) => setPayment((current) => ({ ...current, reference: text }))}
            />
          </>
        ) : null}
      </Card>

      <Button title={mode === 'renew' ? 'Renew' : 'Change Plan'} icon="renew" loading={saving} onPress={save} />
    </Screen>
  );
}

function AdjustForm({ mode, member }: { mode: 'extend' | 'edit'; member: Member }) {
  const theme = useTheme();
  const { account } = useBusiness();
  const membership = member.membership!;

  const [days, setDays] = useState('');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState(membership.start_date);
  const [discount, setDiscount] = useState(String(Number(membership.discount)));
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    const next: Record<string, string> = {};
    if (mode === 'extend' && !(Number(days) >= 1 && Number(days) <= 365)) next.extend_days = 'Enter 1–365 days.';
    if (mode === 'edit' && !isValidISODate(startDate)) next.start_date = 'Choose a start date.';
    if (mode === 'edit' && Number(discount || 0) > Number(membership.amount)) {
      next.discount = "Discount can't exceed the plan amount.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    setFormError('');
    try {
      await api.updateMembership(
        account.id,
        membership.id,
        mode === 'extend'
          ? { extend_days: Number(days), reason: reason.trim() }
          : { start_date: startDate, discount: Number(discount || 0).toFixed(2) },
      );
      router.back();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setErrors(e.fieldErrors);
      setFormError(e.message || Object.values(e.fieldErrors)[0] || '');
    } finally {
      setSaving(false);
    }
  }

  const newEnd = Number(days) > 0 ? toISODate(addDays(parseISODate(membership.end_date), Number(days))) : null;

  return (
    <Screen>
      {formError ? <ErrorBanner message={formError} /> : null}
      <Card
        icon={mode === 'extend' ? 'pause' : 'edit'}
        title={`${memberName(member)} · ${membership.membership_plan.name}`}
        subtitle={`${formatDate(membership.start_date)} – ${formatDate(membership.end_date)}`}>
        {mode === 'extend' ? (
          <>
            <Text style={[styles.note, { color: theme.textSecondary }]}>
              Adds days to the end date, e.g. when a member travels or is unwell.
            </Text>
            <View style={styles.row}>
              {EXTEND_PRESETS.map((preset) => (
                <View key={preset} style={styles.flex}>
                  <Chip label={`${preset} days`} selected={days === String(preset)} onPress={() => setDays(String(preset))} />
                </View>
              ))}
            </View>
            <TextField
              label="Days"
              required
              icon="calendar"
              keyboardType="number-pad"
              maxLength={3}
              value={days}
              onChangeText={(text) => setDays(text.replace(/\D/g, ''))}
              error={errors.extend_days}
              hint={newEnd ? ({ text: `new end ${formatDate(newEnd)}`, tone: 'muted' } as const) : undefined}
            />
            <TextField label="Reason" placeholder="e.g. Travel, medical (optional)" value={reason} onChangeText={setReason} />
          </>
        ) : (
          <>
            <DateField
              label="Start Date"
              required
              value={startDate}
              onChange={setStartDate}
              error={errors.start_date}
              note="The end date follows the plan."
            />
            <TextField
              label="Discount (₹)"
              icon="money"
              placeholder="0"
              keyboardType="decimal-pad"
              value={discount}
              onChangeText={(text) => setDiscount(text.replace(/[^\d.]/g, ''))}
              error={errors.discount}
              hint={{ text: `on ${formatMoney(membership.amount)}`, tone: 'muted' }}
            />
          </>
        )}
      </Card>
      <Button title="Save" icon="check" loading={saving} onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  plans: {
    gap: Spacing.two,
  },
  error: {
    fontSize: 13,
  },
  note: {
    fontSize: 13,
    lineHeight: 19,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
  },
  flex: {
    flex: 1,
  },
});
