import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { initialStay, StayFields, stayInput, validateStay, type StayErrors, type StayValues } from '@/components/pg/stay-fields';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ErrorBanner } from '@/components/ui/error-banner';
import { type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { ApiError, type PgRoom, type PgSettings, type PgTenantInput, type PgTenantProfile } from '@/lib/api';
import { isValidMobile, MOBILE_ERROR } from '@/lib/mobile';
import { BILLING_CYCLES, ID_TYPES } from '@/lib/pg';

const GENDERS: { value: string; icon: IconName }[] = [
  { value: 'Male', icon: 'male' },
  { value: 'Female', icon: 'female' },
  { value: 'Other', icon: 'person' },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DETAIL_FIELDS = [
  'first_name', 'last_name', 'phone', 'email', 'occupation', 'permanent_address', 'id_last4',
  'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation', 'vehicle_number',
] as const;
type DetailField = (typeof DETAIL_FIELDS)[number];

type TenantFormProps = {
  /** The tenant being edited; omit to add one (with their bed and first bill). */
  tenant?: PgTenantProfile;
  rooms: PgRoom[];
  settings: PgSettings | null;
  /** Pre-chosen bed, e.g. when "+ Add tenant" was tapped on a free bed. */
  bedId?: number;
  onSubmit: (input: PgTenantInput) => Promise<void>;
};

export function TenantForm({ tenant, rooms, settings, bedId, onSubmit }: TenantFormProps) {
  const details = tenant?.pg_details;
  const initial = Object.fromEntries(
    DETAIL_FIELDS.map((field) => [
      field,
      (field in (tenant ?? {}) ? tenant?.[field as keyof PgTenantProfile] : details?.[field as keyof typeof details]) ?? '',
    ]),
  ) as Record<DetailField, string>;

  const [values, setValues] = useState(initial);
  const [gender, setGender] = useState(tenant?.gender ?? '');
  const [idType, setIdType] = useState(details?.id_type ?? '');
  const [stay, setStay] = useState<StayValues>(() => initialStay(settings, rooms, bedId));
  // Editing: rent terms of the current stay (they apply from the next bill).
  const tenancy = tenant?.tenancy;
  const [terms, setTerms] = useState({
    rent: tenancy ? String(Number(tenancy.rent)) : '',
    due_day: tenancy ? String(tenancy.due_day) : '',
    cycle: tenancy?.billing_cycle_months ?? 1,
    deposit_amount: tenancy ? String(Number(tenancy.deposit_amount)) : '',
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [stayErrors, setStayErrors] = useState<StayErrors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field: DetailField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit() {
    const trimmed = Object.fromEntries(DETAIL_FIELDS.map((f) => [f, values[f].trim()])) as Record<DetailField, string>;
    trimmed.email = trimmed.email.toLowerCase();
    const next: Record<string, string> = {};
    if (!trimmed.first_name) next.first_name = 'Enter the first name.';
    if (!isValidMobile(trimmed.phone)) next.phone = MOBILE_ERROR;
    if (trimmed.email && !EMAIL_PATTERN.test(trimmed.email)) next.email = 'Enter a valid email address.';
    if (trimmed.emergency_contact_phone && !isValidMobile(trimmed.emergency_contact_phone)) {
      next.emergency_contact_phone = MOBILE_ERROR;
    }
    if (trimmed.id_last4 && !/^[0-9A-Za-z]{4}$/.test(trimmed.id_last4)) next.id_last4 = 'Enter the last 4 characters.';
    if (tenant) {
      if (!terms.rent.trim() || !(Number(terms.rent) >= 0)) next.rent = 'Enter the monthly rent.';
      const day = Number(terms.due_day);
      if (!(Number.isInteger(day) && day >= 1 && day <= 28)) next.due_day = 'Use a day from 1 to 28.';
    }
    const nextStay = tenant ? {} : validateStay(stay);
    setErrors(next);
    setStayErrors(nextStay);
    setFormError('');
    if (Object.keys(next).length || Object.keys(nextStay).length) {
      setFormError('Please fix the highlighted fields.');
      return;
    }

    // New: send what's filled in. Edit: send only what changed.
    const input: PgTenantInput = {};
    for (const field of DETAIL_FIELDS) {
      if (tenant ? trimmed[field] !== initial[field] : trimmed[field]) input[field] = trimmed[field];
    }
    if (tenant ? gender !== (tenant.gender ?? '') : gender) input.gender = gender;
    if (tenant ? idType !== (details?.id_type ?? '') : idType) input.id_type = idType;
    if (tenant && tenancy) {
      if (Number(terms.rent) !== Number(tenancy.rent)) input.rent = Number(terms.rent).toFixed(2);
      if (Number(terms.due_day) !== tenancy.due_day) input.due_day = Number(terms.due_day);
      if (terms.cycle !== tenancy.billing_cycle_months) input.billing_cycle_months = terms.cycle;
      if (Number(terms.deposit_amount || 0) !== Number(tenancy.deposit_amount)) {
        input.deposit_amount = Number(terms.deposit_amount || 0).toFixed(2);
      }
    }
    if (!tenant) Object.assign(input, stayInput(stay));

    setSubmitting(true);
    try {
      await onSubmit(input);
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setErrors(e.fieldErrors);
      setStayErrors({ bed: e.fieldErrors.bed_id, rent: e.fieldErrors.rent, deposit_paid: e.fieldErrors.deposit_paid });
      setFormError(e.message || Object.values(e.fieldErrors)[0] || '');
    } finally {
      setSubmitting(false);
    }
  }

  const field = (name: DetailField) => ({
    value: values[name],
    onChangeText: (text: string) => update(name, text),
    error: errors[name],
  });

  return (
    <Screen>
      {formError ? <ErrorBanner message={formError} /> : null}

      <Card title="Tenant Details">
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField label="First Name" required placeholder="First name" autoCapitalize="words" {...field('first_name')} />
          </View>
          <View style={styles.flex}>
            <TextField label="Last Name" placeholder="Last name" autoCapitalize="words" {...field('last_name')} />
          </View>
        </View>
        <TextField
          label="Mobile No."
          required
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
        <TextField label="Work / College" icon="store" placeholder="e.g. Infosys, JNTU" {...field('occupation')} />
      </Card>

      {tenant ? (
        <Card title="Rent" subtitle="Changes apply from the next bill.">
          <TextField
            label="Monthly Rent (₹)"
            required
            icon="rupee"
            keyboardType="decimal-pad"
            value={terms.rent}
            onChangeText={(text) => setTerms({ ...terms, rent: text.replace(/[^\d.]/g, '') })}
            error={errors.rent}
          />
          <View style={styles.chips}>
            {BILLING_CYCLES.map((cycle) => (
              <View key={cycle.months} style={styles.chip}>
                <Chip
                  label={cycle.label}
                  selected={terms.cycle === cycle.months}
                  onPress={() => setTerms({ ...terms, cycle: cycle.months })}
                />
              </View>
            ))}
          </View>
          <View style={styles.row}>
            <View style={styles.flex}>
              <TextField
                label="Due On (day)"
                keyboardType="number-pad"
                maxLength={2}
                value={terms.due_day}
                onChangeText={(text) => setTerms({ ...terms, due_day: text.replace(/\D/g, '') })}
                error={errors.due_day}
              />
            </View>
            <View style={styles.flex}>
              <TextField
                label="Deposit (₹)"
                keyboardType="decimal-pad"
                value={terms.deposit_amount}
                onChangeText={(text) => setTerms({ ...terms, deposit_amount: text.replace(/[^\d.]/g, '') })}
                error={errors.deposit_amount}
              />
            </View>
          </View>
        </Card>
      ) : (
        <StayFields values={stay} onChange={setStay} errors={stayErrors} rooms={rooms} />
      )}

      <Card title="ID & Address" subtitle="Optional. Only the last 4 digits of the ID are kept.">
        <View style={styles.chips}>
          {ID_TYPES.map((option) => (
            <View key={option.value} style={styles.chip}>
              <Chip
                label={option.label}
                selected={idType === option.value}
                onPress={() => setIdType(idType === option.value ? '' : option.value)}
              />
            </View>
          ))}
        </View>
        <TextField
          label="ID Last 4 Digits"
          icon="badge"
          placeholder="e.g. 4821"
          maxLength={4}
          autoCapitalize="characters"
          {...field('id_last4')}
        />
        <TextField label="Home Address" icon="location" placeholder="Permanent address" multiline {...field('permanent_address')} />
        <TextField label="Vehicle Number" placeholder="e.g. TS09AB1234" autoCapitalize="characters" {...field('vehicle_number')} />
      </Card>

      <Card title="Emergency Contact" subtitle="Optional. Who to call if something happens.">
        <TextField label="Name" placeholder="e.g. Ramesh" autoCapitalize="words" {...field('emergency_contact_name')} />
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField
              label="Mobile"
              keyboardType="phone-pad"
              maxLength={16}
              {...field('emergency_contact_phone')}
              onChangeText={(text) => update('emergency_contact_phone', text.replace(/[^\d+]/g, ''))}
            />
          </View>
          <View style={styles.flex}>
            <TextField label="Relation" placeholder="e.g. Father" autoCapitalize="words" {...field('emergency_contact_relation')} />
          </View>
        </View>
      </Card>

      {/* Repeated by the button: on a long form the one at the top is out of sight. */}
      {formError ? <ErrorBanner message={formError} /> : null}
      <Button title={tenant ? 'Save Changes' : 'Add Tenant'} icon={tenant ? 'check' : 'personAdd'} loading={submitting} onPress={submit} />
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexBasis: '30%',
    flexGrow: 1,
  },
});
