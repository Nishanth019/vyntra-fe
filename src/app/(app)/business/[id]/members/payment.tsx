import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MemberPicker } from '@/components/member-picker';
import { PaymentMethodPicker } from '@/components/payment-method-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateField } from '@/components/ui/date-field';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Screen } from '@/components/ui/screen';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError, type Member } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { isValidISODate, toISODate } from '@/lib/dates';
import { formatMoney, initials, memberName } from '@/lib/format';
import { paymentAmountError } from '@/lib/payments';

export default function RecordPaymentScreen() {
  const theme = useTheme();
  const { account } = useBusiness();
  const params = useLocalSearchParams<{ memberId?: string }>();

  const today = toISODate(new Date());
  const [member, setMember] = useState<Member | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [date, setDate] = useState(today);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ member?: string; amount?: string; date?: string }>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pre-select the member when opened from their profile.
  useEffect(() => {
    if (!params.memberId) return;
    api.member(account.id, Number(params.memberId)).then(applyMember, () => {});
  }, [account.id, params.memberId]);

  function applyMember(selected: Member) {
    setMember(selected);
    setErrors((current) => ({ ...current, member: undefined }));
    // Default to the outstanding balance when there is one.
    const balance = selected.membership ? Number(selected.membership.balance) : 0;
    setAmount(balance > 0 ? String(balance) : '');
  }

  async function submit() {
    const nextErrors: typeof errors = {};
    if (!member) nextErrors.member = 'Select a member.';
    // Like the server: the current plan first, then (once it's paid up) a waiting future plan.
    const current = member?.membership ? Number(member.membership.balance) : 0;
    const due = current > 0 ? current : Number(member?.next_membership?.balance ?? 0);
    const amountError = member?.membership ? paymentAmountError(amount, due) : Number(amount) > 0 ? '' : 'Enter the amount received.';
    if (amountError) nextErrors.amount = amountError;
    if (!isValidISODate(date)) nextErrors.date = 'Choose the payment date.';
    else if (date > today) nextErrors.date = "Payment date can't be in the future.";
    setErrors(nextErrors);
    setFormError('');
    if (!member || Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api.recordPayment(account.id, {
        member_id: member.id,
        amount: Number(amount).toFixed(2),
        payment_method: method,
        payment_date: `${date}T00:00:00Z`,
        ...(reference.trim() ? { transaction_reference: reference.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      router.back();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setErrors({
        member: e.fieldErrors.member_id,
        amount: e.fieldErrors.amount,
        date: e.fieldErrors.payment_date,
      });
      setFormError(e.message);
      setSubmitting(false);
    }
  }

  const membership = member?.membership ?? null;
  const balance = membership ? Number(membership.balance) : 0;

  return (
    <Screen>
      {formError ? <ErrorBanner message={formError} /> : null}

      {member ? (
        <Card>
          <View style={styles.summary}>
            <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
              <Text style={[styles.avatarText, { color: theme.primary }]}>{initials(memberName(member))}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                {memberName(member)}
              </Text>
              <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
                Plan: <Text style={{ color: theme.text }}>{membership?.membership_plan.name ?? '—'}</Text>
              </Text>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>Member ID: #{member.member_code}</Text>
            </View>
            <View style={[styles.balance, { borderColor: theme.border }]}>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>Balance Due</Text>
              <Text style={[styles.balanceValue, { color: balance > 0 ? theme.danger : theme.success }]}>
                {formatMoney(balance)}
              </Text>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: balance > 0 ? theme.dangerSoft : theme.successSoft }]}>
            <Text style={[styles.badgeText, { color: balance > 0 ? theme.danger : theme.success }]}>
              {balance > 0 ? `${formatMoney(balance)} pending on the current plan` : 'All payments up to date'}
            </Text>
          </View>
        </Card>
      ) : null}

      <Card>
        <SelectField
          label="Member"
          icon="search"
          placeholder="Select member"
          value={member ? `${memberName(member)} (#${member.member_code})` : undefined}
          error={errors.member}
          onPress={() => setPickerOpen(true)}
        />
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
          placeholder="e.g. UPI ID, cheque no., transaction ID"
          autoCapitalize="characters"
          value={reference}
          onChangeText={setReference}
        />
        <TextField
          label="Notes (Optional)"
          placeholder="Add any notes here..."
          multiline
          maxLength={200}
          value={notes}
          onChangeText={setNotes}
        />
      </Card>

      <Button title="Record Payment" icon="checkCircle" loading={submitting} onPress={submit} />

      <MemberPicker visible={pickerOpen} activeOnly onClose={() => setPickerOpen(false)} onSelect={applyMember} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
  },
  meta: {
    fontSize: 13,
    marginTop: 2,
  },
  balance: {
    alignItems: 'flex-end',
    paddingLeft: Spacing.three - 4,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  badge: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
