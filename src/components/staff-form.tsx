import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, type Staff, type StaffInput } from '@/lib/api';
import { isValidMobile, MOBILE_ERROR } from '@/lib/mobile';

// Quick picks; any other role can be typed in.
const ROLES = ['Trainer', 'Front Desk', 'Manager', 'Housekeeping'];

const FIELDS = ['employee_code', 'first_name', 'last_name', 'phone', 'email', 'role'] as const;
type Field = (typeof FIELDS)[number];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type StaffFormProps = {
  /** The staff member being edited; omit to add a new one. */
  staff?: Staff;
  /** Saves the changed fields. Throw an ApiError to show its messages on the form. */
  onSubmit: (input: StaffInput) => Promise<void>;
};

export function StaffForm({ staff, onSubmit }: StaffFormProps) {
  const theme = useTheme();
  const initial = Object.fromEntries(FIELDS.map((field) => [field, staff?.[field] ?? ''])) as Record<Field, string>;

  const [values, setValues] = useState(initial);
  const [isActive, setIsActive] = useState(staff?.is_active ?? true);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit() {
    const trimmed = Object.fromEntries(FIELDS.map((field) => [field, values[field].trim()])) as Record<Field, string>;
    trimmed.email = trimmed.email.toLowerCase();

    const nextErrors: Partial<Record<Field, string>> = {};
    if (!trimmed.employee_code) nextErrors.employee_code = 'Enter an employee ID.';
    if (!trimmed.first_name) nextErrors.first_name = 'Enter the first name.';
    if (trimmed.phone && !isValidMobile(trimmed.phone)) nextErrors.phone = MOBILE_ERROR;
    if (trimmed.email && !EMAIL_PATTERN.test(trimmed.email)) nextErrors.email = 'Enter a valid email address.';
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    // New: send what's filled in. Edit: send only what changed.
    const input: StaffInput = {};
    for (const field of FIELDS) {
      if (staff ? trimmed[field] !== initial[field] : trimmed[field]) input[field] = trimmed[field];
    }
    if (staff && isActive !== staff.is_active) input.is_active = isActive;

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

  const field = (name: Field) => ({
    value: values[name],
    onChangeText: (text: string) => update(name, text),
    error: errors[name],
  });

  return (
    <Screen>
      {formError ? <ErrorBanner message={formError} /> : null}

      <Card title="Staff Details">
        <TextField
          label="Employee ID"
          required
          icon="badge"
          placeholder="e.g. EMP001"
          autoCapitalize="characters"
          {...field('employee_code')}
        />
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
      </Card>

      <Card title="Role" subtitle="Pick one or type your own.">
        <View style={styles.roles}>
          {ROLES.map((role) => (
            <View key={role} style={styles.role}>
              <Chip
                label={role}
                selected={values.role === role}
                onPress={() => update('role', values.role === role ? '' : role)}
              />
            </View>
          ))}
        </View>
        <TextField label="Role" hideLabel placeholder="e.g. Yoga Instructor" autoCapitalize="words" {...field('role')} />

        {staff ? (
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <Text style={[styles.label, { color: theme.text }]}>Active</Text>
              <Text style={[styles.hint, { color: theme.textSecondary }]}>Turn off when they leave.</Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ true: theme.primary, false: theme.border }}
              thumbColor={theme.onPrimary}
            />
          </View>
        ) : null}
      </Card>

      <Button title={staff ? 'Save Changes' : 'Add Staff'} loading={submitting} onPress={submit} />
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
  roles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  role: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 13,
    marginTop: 2,
  },
});
