import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Gradient } from '@/components/ui/gradient';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Radius, shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, type BusinessAccount, type BusinessAccountInput } from '@/lib/api';
import { isValidMobile, MOBILE_ERROR } from '@/lib/mobile';

const FIELDS = [
  'name',
  'address',
  'city',
  'state',
  'country',
  'contact_no',
  'email',
  'website',
  'terms_and_conditions',
] as const;

type Field = (typeof FIELDS)[number];
type Values = Record<Field, string>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^https?:\/\/\S+\.\S+$/i;

function toValues(account?: BusinessAccount): Values {
  const values = Object.fromEntries(FIELDS.map((field) => [field, account?.[field] ?? ''])) as Values;
  // New organisations are in India for now.
  if (!account) values.country = 'India';
  return values;
}

type OrganisationFormProps = {
  /** The account being edited; omit to create a new one. */
  account?: BusinessAccount;
  submitLabel: string;
  /** Saves the changed fields. Throw an ApiError to show its messages on the form. */
  onSubmit: (input: BusinessAccountInput) => Promise<void>;
  /** Shown below the submit button, e.g. a danger zone. */
  footer?: ReactNode;
};

/** Create / edit form for a business account (organisation). */
export function OrganisationForm({ account, submitLabel, onSubmit, footer }: OrganisationFormProps) {
  const theme = useTheme();
  const initial = toValues(account);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit() {
    const trimmed = Object.fromEntries(FIELDS.map((field) => [field, values[field].trim()])) as Values;
    trimmed.email = trimmed.email.toLowerCase();

    const nextErrors: Partial<Record<Field, string>> = {};
    if (!trimmed.name) nextErrors.name = 'Enter your organisation name.';
    if (trimmed.contact_no && !isValidMobile(trimmed.contact_no)) nextErrors.contact_no = MOBILE_ERROR;
    if (trimmed.email && !EMAIL_PATTERN.test(trimmed.email)) nextErrors.email = 'Enter a valid email address.';
    if (trimmed.website && !URL_PATTERN.test(trimmed.website)) {
      nextErrors.website = 'Enter a full link, e.g. https://example.com';
    }
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    // New: send what's filled in. Edit: send only what changed (clearing a field sends "").
    const input: BusinessAccountInput = {};
    for (const field of FIELDS) {
      if (account ? trimmed[field] !== initial[field] : trimmed[field]) input[field] = trimmed[field];
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

  const field = (name: Field) => ({
    value: values[name],
    onChangeText: (text: string) => update(name, text),
    error: errors[name],
  });

  return (
    <Screen>
      <Card>
        <View style={styles.identity}>
          <View style={[styles.logo, shadow(theme.primary, 2)]}>
            <Gradient from={theme.primary} to={theme.primaryEnd} />
            <Icon name="dumbbell" color={theme.onPrimary} size={34} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>
              {values.name.trim() || 'Your organisation'}
            </Text>
            <Text style={[styles.tagline, { color: theme.textSecondary }]} numberOfLines={2}>
              {account
                ? [account.business_type.name, values.city.trim()].filter(Boolean).join(' · ')
                : 'These details appear on your dashboard and help members reach you.'}
            </Text>
          </View>
        </View>
      </Card>

      {formError ? <ErrorBanner message={formError} /> : null}

      <Card title="Basic">
        <TextField
          label="Organisation Name"
          required
          placeholder="Your organisation name"
          autoCapitalize="words"
          {...field('name')}
        />
      </Card>

      <Card title="Location" subtitle="Where your members can find you.">
        <TextField label="Home / Area / Street" placeholder="e.g. 100 Feet Road, Koramangala" {...field('address')} />
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField label="City" placeholder="City" autoCapitalize="words" {...field('city')} />
          </View>
          <View style={styles.flex}>
            <TextField label="State" placeholder="State" autoCapitalize="words" {...field('state')} />
          </View>
        </View>
        <TextField label="Country" placeholder="Country" autoCapitalize="words" {...field('country')} />
      </Card>

      <Card title="Contact" subtitle="How members and staff reach the organisation.">
        <TextField
          label="Mobile No."
          icon="phone"
          placeholder="Contact number"
          keyboardType="phone-pad"
          maxLength={20}
          {...field('contact_no')}
        />
        <TextField
          label="Email"
          icon="mail"
          placeholder="hello@yourgym.com"
          autoCapitalize="none"
          keyboardType="email-address"
          {...field('email')}
        />
      </Card>

      <Card title="Optional details" subtitle="Used for invoices and your business profile.">
        <TextField
          label="Website"
          icon="globe"
          placeholder="https://example.com"
          autoCapitalize="none"
          keyboardType="url"
          {...field('website')}
        />
        <TextField
          label="Terms & Conditions"
          placeholder="Shown on invoices (optional)"
          multiline
          {...field('terms_and_conditions')}
        />
      </Card>

      <Button title={submitLabel} loading={submitting} onPress={submit} />
      {footer}
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
  },
  tagline: {
    fontSize: 14,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
  },
});
