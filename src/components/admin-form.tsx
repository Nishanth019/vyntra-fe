import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, type AccountAdmin, type AccountAdminInput, type SignupInput } from '@/lib/api';
import { confirm } from '@/lib/confirm';
import { isValidMobile, MOBILE_ERROR } from '@/lib/mobile';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AdminFormProps =
  | { accountAdmin?: undefined; onSubmit: (input: SignupInput) => Promise<void> }
  | {
      /** The admin being edited. */
      accountAdmin: AccountAdmin;
      /** Hides the login access switch, since admins can't block themselves. */
      isSelf: boolean;
      onSubmit: (input: AccountAdminInput) => Promise<void>;
      /** Removes them from this business; not offered for yourself or the owner. */
      onRemove: () => Promise<void>;
      /** Sets a new password for them (e.g. they forgot it); not offered for yourself or the owner. */
      onSetPassword: (password: string) => Promise<void>;
    };

/** Add an admin (a new login) or edit one's details and access to this business. */
export function AdminForm(props: AdminFormProps) {
  const theme = useTheme();
  const editing = props.accountAdmin;

  const [values, setValues] = useState({
    full_name: editing?.admin.full_name ?? '',
    mobile_no: editing?.admin.mobile_no ?? '',
    email: editing?.admin.email ?? '',
    password: '',
  });
  const [hasAccess, setHasAccess] = useState(editing?.is_active ?? true);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const canRemove = props.accountAdmin && !props.isSelf && props.accountAdmin.role !== 'OWNER';

  async function remove() {
    if (!props.accountAdmin) return;
    const name = props.accountAdmin.admin.full_name;
    const ok = await confirm(
      `Remove ${name}?`,
      `${name} will lose access to this business straight away. Their login isn't deleted, and you can add them again later.`,
      'Remove',
    );
    if (!ok) return;
    setFormError('');
    setRemoving(true);
    try {
      await props.onRemove();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setFormError(e.message);
      setRemoving(false);
    }
  }

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit() {
    const input = {
      full_name: values.full_name.trim(),
      mobile_no: values.mobile_no.trim(),
      email: values.email.trim().toLowerCase(),
    };
    const nextErrors: Record<string, string> = {};
    if (!input.full_name) nextErrors.full_name = 'Enter their full name.';
    if (!isValidMobile(input.mobile_no)) nextErrors.mobile_no = MOBILE_ERROR;
    if (!EMAIL_PATTERN.test(input.email)) nextErrors.email = 'Enter a valid email address.';
    if (!editing && values.password.length < 8) nextErrors.password = 'Use at least 8 characters.';
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      if (props.accountAdmin) {
        // Send only what changed.
        const changes: AccountAdminInput = {};
        for (const key of ['full_name', 'mobile_no', 'email'] as const) {
          if (input[key] !== props.accountAdmin.admin[key]) changes[key] = input[key];
        }
        if (hasAccess !== props.accountAdmin.is_active) changes.is_active = hasAccess;
        await props.onSubmit(changes);
      } else {
        await props.onSubmit({ ...input, password: values.password });
      }
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setErrors(e.fieldErrors);
      setFormError(e.message || Object.values(e.fieldErrors)[0] || '');
    } finally {
      setSubmitting(false);
    }
  }

  const field = (name: keyof typeof values) => ({
    value: values[name],
    onChangeText: (text: string) => update(name, text),
    error: errors[name],
  });

  return (
    <Screen>
      {!editing ? (
        <Card
          title="Add an admin"
          subtitle="They'll log in with this email or mobile number and password, and can manage this business."
          tone="accent"
        />
      ) : null}

      {formError ? <ErrorBanner message={formError} /> : null}

      <Card title="Admin Details">
        <TextField label="Name" required icon="person" placeholder="Full name" autoCapitalize="words" {...field('full_name')} />
        <TextField
          label="Mobile No."
          required
          icon="phone"
          placeholder="9876543210"
          keyboardType="number-pad"
          maxLength={15}
          {...field('mobile_no')}
          onChangeText={(text) => update('mobile_no', text.replace(/\D/g, ''))}
        />
        <TextField
          label="Email"
          required
          icon="mail"
          placeholder="name@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          {...field('email')}
        />
        {!editing ? (
          <TextField
            label="Password"
            required
            icon="lock"
            password
            placeholder="At least 8 characters"
            autoCapitalize="none"
            autoComplete="new-password"
            {...field('password')}
          />
        ) : null}

        {props.accountAdmin && !props.isSelf ? (
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <Text style={[styles.label, { color: theme.text }]}>Login Access</Text>
              <Text style={[styles.hint, { color: theme.textSecondary }]}>
                Turn off to block them from this business.
              </Text>
            </View>
            <Switch
              value={hasAccess}
              onValueChange={setHasAccess}
              trackColor={{ true: theme.primary, false: theme.border }}
              thumbColor={theme.onPrimary}
            />
          </View>
        ) : null}
      </Card>

      <Button title={editing ? 'Save Changes' : 'Add Admin'} loading={submitting} onPress={submit} />
      {canRemove && props.accountAdmin ? <SetPasswordCard onSetPassword={props.onSetPassword} /> : null}
      {canRemove ? (
        <Button title="Remove from Business" variant="destructive" loading={removing} onPress={remove} />
      ) : null}
    </Screen>
  );
}

/** For an admin who forgot their password: the owner sets a new one and tells them. */
function SetPasswordCard({ onSetPassword }: { onSetPassword: (password: string) => Promise<void> }) {
  const theme = useTheme();
  const [values, setValues] = useState({ next: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function save() {
    const nextErrors: Record<string, string> = {};
    if (values.next.length < 8) nextErrors.next = 'Use at least 8 characters.';
    if (values.confirm !== values.next) nextErrors.confirm = "Passwords don't match.";
    setErrors(nextErrors);
    setMessage(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await onSetPassword(values.next);
      setValues({ next: '', confirm: '' });
      setMessage({ text: 'Password updated. Share the new password with them; they have been signed out.', success: true });
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setErrors({ next: e.fieldErrors.new_password });
      if (e.message) setMessage({ text: e.message, success: false });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Set New Password" subtitle="If they forgot their password, set a new one here and tell them.">
      {message ? (
        message.success ? (
          <Text style={[styles.hint, { color: theme.success }]}>{message.text}</Text>
        ) : (
          <ErrorBanner message={message.text} />
        )
      ) : null}
      <TextField
        label="New Password"
        icon="lock"
        password
        placeholder="At least 8 characters"
        autoCapitalize="none"
        autoComplete="new-password"
        value={values.next}
        onChangeText={(text) => update('next', text)}
        error={errors.next}
      />
      <TextField
        label="Confirm Password"
        icon="lock"
        password
        placeholder="Re-enter password"
        autoCapitalize="none"
        autoComplete="new-password"
        value={values.confirm}
        onChangeText={(text) => update('confirm', text)}
        error={errors.confirm}
      />
      <Button title="Set Password" variant="secondary" icon="lock" loading={saving} onPress={save} />
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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
