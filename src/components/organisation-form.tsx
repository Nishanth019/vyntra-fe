import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { ApiError, type BusinessAccount, type BusinessAccountInput } from '@/lib/api';

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
  return Object.fromEntries(FIELDS.map((field) => [field, account?.[field] ?? ''])) as Values;
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
      {!account ? (
        <Card
          icon="store"
          title="Set up your organisation"
          subtitle="These details appear on your dashboard and help members reach you."
          tone="accent"
        />
      ) : null}

      {formError ? <ErrorBanner message={formError} /> : null}

      <Card>
        <TextField
          label="Organisation Name"
          required
          icon="store"
          placeholder="Your organisation name"
          autoCapitalize="words"
          {...field('name')}
        />
      </Card>

      <Card icon="map" title="Location" subtitle="Where your members can find you." tone="primary">
        <TextField
          label="Home / Area / Street"
          icon="location"
          placeholder="Home / Area / Street"
          {...field('address')}
        />
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField label="City" placeholder="City" autoCapitalize="words" {...field('city')} />
          </View>
          <View style={styles.flex}>
            <TextField label="State" placeholder="State" autoCapitalize="words" {...field('state')} />
          </View>
        </View>
        <TextField label="Country" icon="globe" placeholder="Country" autoCapitalize="words" {...field('country')} />
      </Card>

      <Card icon="phone" title="Contact" subtitle="How members and staff reach the organisation.">
        <TextField
          label="Mobile No."
          icon="phone"
          placeholder="Organisation contact number"
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

      <Card icon="settings" title="Optional details" subtitle="Used for invoices and your business profile.">
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
          icon="document"
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
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
  },
});
