import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import type { PlanMode } from '@/components/membership-card';
import { PlanOption } from '@/components/plan-option';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError, type Member, type MembershipPlan } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { addDays, daysUntil, formatDate, formatDateInput, isValidISODate, parseISODate, toISODate } from '@/lib/dates';
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

/** Value of the current plan's unused days from today: credited when changing plan mid-way. */
function unusedCredit(member: Member) {
  const membership = member.membership;
  // An upcoming renewal is swapped in place, so there's nothing to credit.
  if (!membership || daysUntil(membership.start_date) > 0) return 0;
  const totalDays = daysUntil(membership.end_date) - daysUntil(membership.start_date) + 1;
  // Today onwards is unused (the old plan ends yesterday); all of it if it hasn't started yet.
  const unusedDays = Math.min(daysUntil(membership.end_date) + 1, totalDays);
  if (totalDays <= 0 || unusedDays <= 0) return 0;
  return Math.round((Number(membership.net_payable) * unusedDays) / totalDays);
}

function defaultRenewalStart(member: Member) {
  const end = member.membership?.end_date;
  return end && daysUntil(end) >= 0 ? toISODate(addDays(parseISODate(end), 1)) : toISODate(new Date());
}

function NewPlanForm({ mode, member, plans }: { mode: 'renew' | 'change'; member: Member; plans: MembershipPlan[] }) {
  const theme = useTheme();
  const { account } = useBusiness();
  const credit = mode === 'change' ? unusedCredit(member) : 0;

  const currentPlanId = member.membership?.membership_plan.id ?? null;
  const [planId, setPlanId] = useState<number | null>(mode === 'renew' ? currentPlanId : null);
  const [startDate, setStartDate] = useState(defaultRenewalStart(member));
  const [discount, setDiscount] = useState(credit ? String(credit) : '');
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
    if (mode === 'renew' && !isValidISODate(startDate)) next.start_date = 'Use the format YYYY-MM-DD.';
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
        ...(mode === 'renew' ? { start_date: startDate } : {}),
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
            ? 'Pick any plan, including the same one. The current plan stays in their history.'
            : member.membership && daysUntil(member.membership.start_date) > 0
              ? `Replaces the upcoming plan starting ${formatDate(member.membership.start_date)}.`
              : 'The current plan ends yesterday and the new one starts today.'
        }>
        <View style={styles.plans}>
          {plans.map((item) => (
            <PlanOption key={item.id} plan={item} selected={item.id === planId} onPress={() => setPlanId(item.id)} />
          ))}
        </View>
        {errors.membership_plan_id ? <Text style={[styles.error, { color: theme.danger }]}>{errors.membership_plan_id}</Text> : null}

        {mode === 'renew' ? (
          <TextField
            label="Start Date"
            required
            icon="calendar"
            placeholder="YYYY-MM-DD"
            keyboardType="number-pad"
            maxLength={10}
            value={startDate}
            onChangeText={(text) => setStartDate(formatDateInput(text))}
            error={errors.start_date}
            hint={
              member.status === 'live' && member.membership
                ? ({ text: `after current plan ends ${formatDate(member.membership.end_date)}`, tone: 'muted' } as const)
                : undefined
            }
          />
        ) : null}

        <TextField
          label={mode === 'change' ? 'Credit / Discount (₹)' : 'Discount (₹)'}
          icon="money"
          placeholder="0"
          keyboardType="decimal-pad"
          value={discount}
          onChangeText={(text) => setDiscount(text.replace(/[^\d.]/g, ''))}
          error={errors.discount}
          hint={plan ? ({ text: `Payable ${formatMoney(payable)}`, tone: 'muted' } as const) : undefined}
        />
        {mode === 'change' && credit > 0 ? (
          <Text style={[styles.note, { color: theme.textSecondary }]}>
            Includes {formatMoney(credit)} credit for the unused days of {member.membership?.membership_plan.name}. You
            can change it.
          </Text>
        ) : null}
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
    if (mode === 'edit' && !isValidISODate(startDate)) next.start_date = 'Use the format YYYY-MM-DD.';
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
            <TextField
              label="Start Date"
              required
              icon="calendar"
              placeholder="YYYY-MM-DD"
              keyboardType="number-pad"
              maxLength={10}
              value={startDate}
              onChangeText={(text) => setStartDate(formatDateInput(text))}
              error={errors.start_date}
              hint={{ text: 'end date follows the plan', tone: 'muted' }}
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
