import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PaymentMethodPicker } from '@/components/payment-method-picker';
import { PlanOptions } from '@/components/plan-option';
import { membershipStatus, StatusPill } from '@/components/status-pill';
import { Chip } from '@/components/ui/chip';
import { DateField } from '@/components/ui/date-field';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Screen } from '@/components/ui/screen';
import { Icon, type IconName } from '@/components/ui/icon';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError, type Member, type MemberInput, type MembershipPlan } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { isValidISODate, toISODate } from '@/lib/dates';
import { formatMoney, memberName } from '@/lib/format';
import { paymentAmountError } from '@/lib/payments';

const GENDERS: { value: string; icon: IconName }[] = [
  { value: 'Male', icon: 'male' },
  { value: 'Female', icon: 'female' },
  { value: 'Other', icon: 'person' },
];

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
};

export function MemberForm({
  member,
  plans,
  suggestedCode = '',
  onSubmit,
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
  // New members: someone already registered with this mobile number or email (to renew instead).
  const [duplicateCheck, setDuplicateCheck] = useState<{
    key: string;
    member: Member | null;
    matchedBy: 'mobile' | 'email';
  } | null>(null);
  // Emergency contact is optional, so it starts collapsed unless it has details.
  const [showEmergency, setShowEmergency] = useState(
    Boolean(member?.gym_details?.emergency_contact_name || member?.gym_details?.emergency_contact_phone),
  );
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  // Adding someone whose mobile or email is already registered? Offer to renew / open them instead.
  const phone = PHONE_PATTERN.test(values.phone.trim()) ? values.phone.trim() : '';
  const email = EMAIL_PATTERN.test(values.email.trim()) ? values.email.trim().toLowerCase() : '';
  const duplicateKey = `${phone}|${email}`;
  useEffect(() => {
    if (member || (!phone && !email)) return;
    const timer = setTimeout(async () => {
      try {
        const query = { business_account_id: account.id };
        const [byPhone, byEmail] = await Promise.all([
          phone ? api.members({ ...query, phone }) : null,
          email ? api.members({ ...query, email }) : null,
        ]);
        const match = byPhone?.results[0] ?? byEmail?.results[0] ?? null;
        setDuplicateCheck({ key: duplicateKey, member: match, matchedBy: byPhone?.results[0] ? 'mobile' : 'email' });
      } catch {
        // The check is only a hint; saving still validates.
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [duplicateKey, phone, email, member, account.id]);
  const duplicate = duplicateCheck?.key === duplicateKey && duplicateCheck.member ? duplicateCheck : null;

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
    if (values.date_of_birth && !isValidISODate(values.date_of_birth)) next.date_of_birth = 'Choose a valid date.';
    if (!member) {
      if (!plan) next.membership_plan_id = 'Choose a plan.';
      if (!isValidISODate(values.start_date)) next.start_date = 'Choose a start date.';
      if (discount.trim() && plan) {
        const value = Number(discount);
        if (!(value >= 0)) next.discount = 'Enter a valid discount.';
        else if (value > Number(plan.amount)) next.discount = "Discount can't exceed the plan amount.";
      }
      if (recordPayment && plan) {
        const amountError = paymentAmountError(payment.amount, payable ?? 0);
        if (amountError) next.payment_amount = amountError;
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
        amount: Number(payment.amount).toFixed(2),
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

  const addPlan = () => router.push({ pathname: '/business/[id]/plans/new', params: { id: account.id } });
  const field = (name: keyof typeof values) => ({
    value: values[name],
    onChangeText: (text: string) => update(name, text),
    error: errors[name],
  });

  return (
    <Screen>
      {formError ? <ErrorBanner message={formError} /> : null}

      <Card title="Member Details" subtitle="Basic information about the member">
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

        <View style={styles.gender}>
          <Text style={[styles.label, { color: theme.text }]}>Gender</Text>
          <View style={styles.row}>
            {GENDERS.map((option) => (
              <View key={option.value} style={styles.flex}>
                <Chip
                  label={option.value}
                  icon={option.icon}
                  selected={gender === option.value}
                  onPress={() => setGender(gender === option.value ? '' : option.value)}
                />
              </View>
            ))}
          </View>
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
        {duplicate?.matchedBy === 'mobile' ? <ExistingMember member={duplicate.member!} matchedBy="mobile" /> : null}
        <TextField
          label="Email"
          icon="mail"
          placeholder="name@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          {...field('email')}
        />
        {duplicate?.matchedBy === 'email' ? <ExistingMember member={duplicate.member!} matchedBy="email" /> : null}
        <DateField
          label="Date of Birth"
          placeholder="Optional"
          value={values.date_of_birth}
          onChange={(value) => update('date_of_birth', value)}
          error={errors.date_of_birth}
          maximumDate={new Date()}
          clearable
        />
      </Card>

      <Card
        title="Emergency Contact"
        subtitle="Optional"
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showEmergency ? 'Hide emergency contact' : 'Add emergency contact'}
            hitSlop={10}
            onPress={() => setShowEmergency(!showEmergency)}>
            <Icon name={showEmergency ? 'chevronUp' : 'chevronDown'} color={theme.textSecondary} size={24} />
          </Pressable>
        }>
        {showEmergency ? (
          <>
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
          </>
        ) : null}
      </Card>

      {member ? null : (
        <>
        <Card title="Plan Details" subtitle="Choose a membership plan">

          {plans.length === 0 ? (
            <View style={[styles.noPlans, { backgroundColor: theme.dangerSoft }]}>
              <Text style={[styles.noPlansText, { color: theme.danger }]}>
                No plans found! First create your plans to add a member.
              </Text>
              <Button title="Add Plan" icon="add" variant="danger" onPress={addPlan} />
            </View>
          ) : (
            <PlanOptions plans={plans} value={planId} onChange={setPlanId} />
          )}
          {errors.membership_plan_id ? (
            <Text style={[styles.error, { color: theme.danger }]}>{errors.membership_plan_id}</Text>
          ) : null}

          {plan ? (
            <>
              <DateField
                label="Start Date"
                required
                value={values.start_date}
                onChange={(value) => update('start_date', value)}
                error={errors.start_date}
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
          title="Payment"
          subtitle={recordPayment ? 'Money received now' : 'Turn on to record money received now.'}
          action={
            <Switch
              value={recordPayment}
              onValueChange={setRecordPayment}
              trackColor={{ true: theme.primary, false: theme.border }}
              thumbColor={theme.onPrimary}
              accessibilityLabel="Record a payment"
            />
          }>
          {recordPayment ? (
            <>
              <TextField
                label="Amount Received (₹)"
                icon="money"
                placeholder={payable !== undefined ? `Up to ${payable}` : 'Choose a plan first'}
                keyboardType="decimal-pad"
                value={payment.amount}
                onChangeText={(text) => {
                  setPayment((current) => ({ ...current, amount: text.replace(/[^\d.]/g, '') }));
                  setErrors((current) => ({ ...current, payment_amount: undefined }));
                }}
                error={errors.payment_amount}
              />
              <PaymentMethodPicker
                value={payment.method}
                onChange={(method) => setPayment((current) => ({ ...current, method }))}
              />
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

      <Button
        title={member ? 'Save Changes' : 'Add Member'}
        trailingIcon={member ? undefined : 'arrowRight'}
        loading={submitting}
        onPress={submit}
      />
    </Screen>
  );
}

/** Shown when the mobile number or email being added already belongs to a member of this business. */
function ExistingMember({ member, matchedBy }: { member: Member; matchedBy: 'mobile' | 'email' }) {
  const theme = useTheme();
  const { account } = useBusiness();
  const status = membershipStatus(member);
  const canRenew = member.status !== 'live' && member.status !== 'upcoming';
  const params = { id: account.id, memberId: member.id };

  return (
    <View style={[styles.existing, { backgroundColor: theme.warningSoft, borderColor: theme.warning }]}>
      <View style={styles.existingHeader}>
        <Text style={[styles.existingText, { color: theme.text }]}>
          This {matchedBy === 'mobile' ? 'mobile number' : 'email'} is already registered: {memberName(member)} (#
          {member.member_code})
        </Text>
        <StatusPill {...status} />
      </View>
      <Button
        title={canRenew ? `Renew ${member.first_name}` : `Open ${member.first_name}`}
        icon={canRenew ? 'renew' : 'person'}
        variant="secondary"
        onPress={() =>
          router.replace(
            canRenew
              ? { pathname: '/business/[id]/members/plan', params: { ...params, mode: 'renew' } }
              : { pathname: '/business/[id]/members/[memberId]', params },
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  existing: {
    gap: Spacing.two + 2,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  existingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  existingText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
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
  gender: {
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
});
