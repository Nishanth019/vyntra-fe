import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlanOption } from '@/components/plan-option';
import { Chip } from '@/components/ui/chip';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError, type Member, type MemberInput, type MembershipPlan } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { confirm } from '@/lib/confirm';
import { formatDateInput, isValidISODate, toISODate } from '@/lib/dates';
import { formatMoney, memberName } from '@/lib/format';
import { PAYMENT_METHODS } from '@/lib/payments';

const GENDERS = ['Male', 'Female', 'Other'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?\d{7,15}$/;

type MemberFormProps = {
  /** The member being edited; omit to add a new one. Plans are managed separately when editing. */
  member?: Member;
  /** Active plans to choose from (new members only). */
  plans: MembershipPlan[];
  /** Pre-filled member ID for a new member. */
  suggestedCode?: string;
  /** Saves the member. Throw an ApiError to show its messages on the form. */
  onSubmit: (input: MemberInput) => Promise<void>;
  /** Deactivates (or, when the member is inactive, reactivates) the member. */
  onToggleActive?: () => Promise<void>;
  /** Shown above the member details, e.g. the membership card. */
  header?: ReactNode;
  /** Shown below the save button, e.g. attendance shortcuts. */
  footer?: ReactNode;
};

export function MemberForm({
  member,
  plans,
  suggestedCode = '',
  onSubmit,
  onToggleActive,
  header,
  footer,
}: MemberFormProps) {
  const theme = useTheme();
  const { account } = useBusiness();

  const [values, setValues] = useState({
    member_code: member?.member_code ?? suggestedCode,
    first_name: member?.first_name ?? '',
    last_name: member?.last_name ?? '',
    phone: member?.phone ?? '',
    email: member?.email ?? '',
    date_of_birth: member?.date_of_birth ?? '',
    start_date: toISODate(new Date()),
    emergency_contact_name: member?.gym_details?.emergency_contact_name ?? '',
    emergency_contact_phone: member?.gym_details?.emergency_contact_phone ?? '',
    emergency_contact_address: member?.gym_details?.emergency_contact_address ?? '',
  });
  const [gender, setGender] = useState(member?.gender ?? '');
  const [planId, setPlanId] = useState<number | null>(null);
  const [discount, setDiscount] = useState('');
  // New members usually pay when they join.
  const [recordPayment, setRecordPayment] = useState(true);
  const [payment, setPayment] = useState({ amount: '', method: 'CASH', reference: '', notes: '' });

  const [codeCheck, setCodeCheck] = useState<{ code: string; taken: boolean } | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const plan = plans.find((item) => item.id === planId);
  const code = values.member_code.trim();
  // Amount still payable on the plan after any discount — the default for a new payment.
  const payable = plan ? Math.max(0, Number(plan.amount) - Number(discount || 0)) : undefined;

  // Check the member ID is free once typing pauses.
  useEffect(() => {
    if (!code || code === member?.member_code) return;
    const timer = setTimeout(() => {
      api.members({ business_account_id: account.id, member_code: code }).then(
        ({ results }) => setCodeCheck({ code, taken: results.some((other) => other.id !== member?.id) }),
        () => {},
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [code, account.id, member?.id, member?.member_code]);

  const codeTaken = codeCheck?.code === code && codeCheck.taken;
  const codeHint =
    codeCheck?.code === code && code !== member?.member_code
      ? codeTaken
        ? ({ text: 'taken', tone: 'danger' } as const)
        : ({ text: 'available', tone: 'success' } as const)
      : undefined;

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!code) next.member_code = 'Enter a member ID.';
    else if (codeTaken) next.member_code = 'This member ID is already in use.';
    if (!values.first_name.trim()) next.first_name = 'Enter the first name.';
    if (values.phone && !PHONE_PATTERN.test(values.phone)) next.phone = 'Enter a valid mobile number.';
    if (values.email && !EMAIL_PATTERN.test(values.email.trim())) next.email = 'Enter a valid email address.';
    if (values.date_of_birth && !isValidISODate(values.date_of_birth)) next.date_of_birth = 'Use the format YYYY-MM-DD.';
    if (!member) {
      if (!plan) next.membership_plan_id = 'Choose a plan.';
      if (!isValidISODate(values.start_date)) next.start_date = 'Use the format YYYY-MM-DD.';
      if (discount.trim() && plan) {
        const value = Number(discount);
        if (!(value >= 0)) next.discount = 'Enter a valid discount.';
        else if (value > Number(plan.amount)) next.discount = "Discount can't exceed the plan amount.";
      }
      if (recordPayment && !(Number(payment.amount || payable || 0) > 0)) {
        next.payment_amount = 'Enter the amount received.';
      }
    }
    return next;
  }

  async function submit() {
    const nextErrors = validate();
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) {
      setFormError('Please fix the highlighted fields.');
      return;
    }

    const personal = {
      member_code: code,
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      phone: values.phone.trim(),
      email: values.email.trim().toLowerCase(),
      gender,
    };

    // New: send what's filled in. Edit: send only what changed.
    const input: MemberInput = {};
    for (const [key, value] of Object.entries(personal) as [keyof typeof personal, string][]) {
      if (member ? value !== (member[key] ?? '') : value) input[key] = value;
    }
    if (member ? values.date_of_birth !== (member.date_of_birth ?? '') : values.date_of_birth) {
      input.date_of_birth = values.date_of_birth || null;
    }

    // Emergency contact / address live on the gym profile; send on create or when changed.
    const emergency = {
      emergency_contact_name: values.emergency_contact_name.trim(),
      emergency_contact_phone: values.emergency_contact_phone.trim(),
      emergency_contact_address: values.emergency_contact_address.trim(),
    };
    for (const [key, value] of Object.entries(emergency) as [keyof typeof emergency, string][]) {
      if (member ? value !== (member.gym_details?.[key] ?? '') : value) input[key] = value;
    }

    if (!member && plan) {
      input.membership_plan_id = plan.id;
      input.start_date = values.start_date;
      if (discount.trim()) input.discount = Number(discount).toFixed(2);
    }
    if (!member && recordPayment) {
      input.payment = {
        amount: Number(payment.amount || payable).toFixed(2),
        payment_method: payment.method,
        ...(payment.reference.trim() ? { transaction_reference: payment.reference.trim() } : {}),
        ...(payment.notes.trim() ? { notes: payment.notes.trim() } : {}),
      };
    }

    setSubmitting(true);
    try {
      await onSubmit(input);
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setErrors(e.fieldErrors);
      setFormError(e.message || Object.values(e.fieldErrors)[0] || '');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive() {
    if (!member || !onToggleActive) return;
    if (member.is_active) {
      const ok = await confirm(
        'Deactivate member?',
        `${memberName(member)} will be moved to Inactive. Their history is kept and you can reactivate them anytime.`,
        'Deactivate',
      );
      if (!ok) return;
    }
    setToggling(true);
    try {
      await onToggleActive();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setFormError(e.message);
    } finally {
      setToggling(false);
    }
  }

  const addPlan = () => router.push({ pathname: '/business/[id]/plans/new', params: { id: account.id } });
  const field = (name: keyof typeof values) => ({
    value: values[name],
    onChangeText: (text: string) => update(name, text),
    error: errors[name],
  });

  return (
    <Screen>
      {formError ? <ErrorBanner message={formError} /> : null}
      {header}

      <Card icon="person" title="Member Details">
        <TextField
          label="Member ID"
          required
          icon="badge"
          placeholder="e.g. 101"
          autoCapitalize="characters"
          hint={codeHint}
          {...field('member_code')}
        />
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField label="First Name" required placeholder="First name" autoCapitalize="words" {...field('first_name')} />
          </View>
          <View style={styles.flex}>
            <TextField label="Last Name" placeholder="Last name" autoCapitalize="words" {...field('last_name')} />
          </View>
        </View>

        <View style={styles.genderRow}>
          <Text style={[styles.label, { color: theme.text }]}>Gender</Text>
          {GENDERS.map((option) => (
            <View key={option} style={styles.flex}>
              <Chip
                label={option}
                selected={gender === option}
                onPress={() => setGender(gender === option ? '' : option)}
              />
            </View>
          ))}
        </View>

        <TextField
          label="Mobile"
          icon="phone"
          placeholder="Mobile number"
          keyboardType="phone-pad"
          maxLength={16}
          {...field('phone')}
          onChangeText={(text) => update('phone', text.replace(/[^\d+]/g, ''))}
        />
        <TextField
          label="Email"
          icon="mail"
          placeholder="name@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          {...field('email')}
        />
        <TextField
          label="Date of Birth"
          icon="calendar"
          placeholder="YYYY-MM-DD"
          keyboardType="number-pad"
          maxLength={10}
          {...field('date_of_birth')}
          onChangeText={(text) => update('date_of_birth', formatDateInput(text))}
        />
      </Card>

      <Card icon="phone" title="Emergency Contact" subtitle="Optional — who to reach in an emergency.">
        <TextField
          label="Contact Name"
          placeholder="e.g. parent / spouse"
          autoCapitalize="words"
          {...field('emergency_contact_name')}
        />
        <TextField
          label="Contact Mobile"
          icon="phone"
          placeholder="Mobile number"
          keyboardType="phone-pad"
          maxLength={16}
          {...field('emergency_contact_phone')}
          onChangeText={(text) => update('emergency_contact_phone', text.replace(/[^\d+]/g, ''))}
        />
        <TextField
          label="Address"
          icon="location"
          placeholder="Home address"
          {...field('emergency_contact_address')}
        />
      </Card>

      {member ? null : (
        <>
        <Card icon="plans" title="Plan Details">

          {plans.length === 0 ? (
            <View style={[styles.noPlans, { backgroundColor: theme.dangerSoft }]}>
              <Text style={[styles.noPlansText, { color: theme.danger }]}>
                No plans found! First create your plans to add a member.
              </Text>
              <Button title="Add Plan" icon="add" variant="danger" onPress={addPlan} />
            </View>
          ) : (
            <View style={styles.plans}>
              {plans.map((item) => (
                <PlanOption key={item.id} plan={item} selected={item.id === planId} onPress={() => setPlanId(item.id)} />
              ))}
            </View>
          )}
          {errors.membership_plan_id ? (
            <Text style={[styles.error, { color: theme.danger }]}>{errors.membership_plan_id}</Text>
          ) : null}

          {plan ? (
            <>
              <TextField
                label="Start Date"
                required
                icon="calendar"
                placeholder="YYYY-MM-DD"
                keyboardType="number-pad"
                maxLength={10}
                {...field('start_date')}
                onChangeText={(text) => update('start_date', formatDateInput(text))}
              />
              <TextField
                label="Discount (₹)"
                icon="money"
                placeholder="0"
                keyboardType="decimal-pad"
                value={discount}
                onChangeText={(text) => {
                  setDiscount(text.replace(/[^\d.]/g, ''));
                  setErrors((current) => ({ ...current, discount: undefined }));
                }}
                error={errors.discount}
                hint={
                  discount.trim() && payable !== undefined
                    ? ({ text: `Payable ${formatMoney(payable)}`, tone: 'muted' } as const)
                    : undefined
                }
              />
            </>
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
                placeholder={payable !== undefined ? String(payable) : 'Amount'}
                keyboardType="decimal-pad"
                value={payment.amount}
                onChangeText={(text) => {
                  setPayment((current) => ({ ...current, amount: text.replace(/[^\d.]/g, '') }));
                  setErrors((current) => ({ ...current, payment_amount: undefined }));
                }}
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
              <TextField
                label="Notes"
                placeholder="Optional"
                value={payment.notes}
                onChangeText={(text) => setPayment((current) => ({ ...current, notes: text }))}
              />
            </>
          ) : null}
        </Card>
        </>
      )}

      <Button title={member ? 'Save Changes' : 'Add Member'} loading={submitting} onPress={submit} />
      {footer}

      {member && onToggleActive ? (
        member.is_active ? (
          <Card icon="warning" title="Danger Zone" subtitle="Deactivating ends the current membership." tone="danger">
            <Button title="Deactivate Member" icon="personOff" variant="danger" loading={toggling} onPress={toggleActive} />
          </Card>
        ) : (
          <Button title="Reactivate Member" icon="check" variant="secondary" loading={toggling} onPress={toggleActive} />
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
  },
  flex: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  genderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  error: {
    fontSize: 13,
  },
  noPlans: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  noPlansText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  plans: {
    gap: Spacing.two,
  },
});
