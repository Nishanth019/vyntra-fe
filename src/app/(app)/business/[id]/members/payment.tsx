import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MemberPicker } from '@/components/member-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { DateField } from '@/components/ui/date-field';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Screen } from '@/components/ui/screen';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError, type Member } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { isValidISODate, toISODate } from '@/lib/dates';
import { formatMoney, memberName } from '@/lib/format';

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank' },
];

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
    if (!(Number(amount) > 0)) nextErrors.amount = 'Enter the amount received.';
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

  return (
    <Screen>
      {formError ? <ErrorBanner message={formError} /> : null}

      <Card icon="money" title="Payment details">
        <SelectField
          label="Member"
          icon="search"
          placeholder="Select member"
          value={member ? `${memberName(member)} (#${member.member_code})` : undefined}
          error={errors.member}
          onPress={() => setPickerOpen(true)}
        />

        {membership ? (
          <View style={[styles.balance, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>
              {membership.membership_plan.name} · balance
            </Text>
            <Text
              style={[
                styles.balanceValue,
                { color: Number(membership.balance) > 0 ? theme.danger : theme.success },
              ]}>
              {formatMoney(membership.balance)}
            </Text>
          </View>
        ) : null}

        <TextField
          label="Amount Received (₹)"
          icon="money"
          placeholder="Amount"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={(text) => {
            setAmount(text.replace(/[^\d.]/g, ''));
            setErrors((current) => ({ ...current, amount: undefined }));
          }}
          error={errors.amount}
        />

        <View style={styles.row}>
          {PAYMENT_METHODS.map((item) => (
            <View key={item.value} style={styles.flex}>
              <Chip label={item.label} selected={method === item.value} onPress={() => setMethod(item.value)} />
            </View>
          ))}
        </View>

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
          label="Transaction Reference"
          icon="document"
          placeholder="UPI / card reference (optional)"
          autoCapitalize="characters"
          value={reference}
          onChangeText={setReference}
        />
        <TextField label="Notes" placeholder="Optional" value={notes} onChangeText={setNotes} />
      </Card>

      <Button title="Record Payment" icon="check" loading={submitting} onPress={submit} />

      <MemberPicker visible={pickerOpen} activeOnly onClose={() => setPickerOpen(false)} onSelect={applyMember} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  balance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});
