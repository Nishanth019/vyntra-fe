import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Gradient } from '@/components/ui/gradient';
import { Icon, type IconName } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/icon-badge';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Radius, shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError, type Admin } from '@/lib/api';
import { confirm } from '@/lib/confirm';
import { initials } from '@/lib/format';
import { ACCOUNT_DELETION_URL, PRIVACY_POLICY_URL } from '@/lib/links';
import { useSession } from '@/lib/session';
import { useSubscription } from '@/lib/subscription';
import { isValidMobile, MOBILE_ERROR } from '@/lib/mobile';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfileScreen() {
  const { admin, signOut } = useSession();
  if (!admin) return null;

  return (
    <Screen>
      <ProfileHeader admin={admin} />
      <PersonalInformation admin={admin} />
      <SecuritySection />
      <Button title="Log Out" icon="logout" variant="danger" onPress={signOut} />
      <DeleteAccount onDeleted={signOut} />
    </Screen>
  );
}

/** Play Store requires in-app account deletion. */
function DeleteAccount({ onDeleted }: { onDeleted: () => void }) {
  const theme = useTheme();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function remove() {
    const ok = await confirm(
      'Delete your account?',
      "You won't be able to log in again and your access to every business is removed. Gym records you added stay with the gym.",
      'Delete Account',
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await api.deleteAccount();
      onDeleted();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setError(e.message);
      setDeleting(false);
    }
  }

  return (
    <Card title="Danger Zone" tone="danger">
      <View style={styles.headerRow}>
        <View style={[styles.dangerIcon, { backgroundColor: theme.surface }]}>
          <Icon name="trash" color={theme.danger} size={22} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.dangerTitle, { color: theme.text }]}>Delete Account</Text>
          <Text style={[styles.email, { color: theme.textSecondary }]}>Permanently delete your Vyntra login.</Text>
        </View>
      </View>
      {error ? <ErrorBanner message={error} /> : null}
      <Button title="Delete My Account" variant="destructive" loading={deleting} onPress={remove} />
      <View style={styles.links}>
        <Pressable accessibilityRole="link" onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}>
          <Text style={[styles.link, { color: theme.primary }]}>Privacy Policy</Text>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => WebBrowser.openBrowserAsync(ACCOUNT_DELETION_URL)}>
          <Text style={[styles.link, { color: theme.primary }]}>What gets deleted</Text>
        </Pressable>
      </View>
    </Card>
  );
}

function ProfileHeader({ admin }: { admin: Admin }) {
  const theme = useTheme();
  // Owner of at least one business (they pay for Vyntra), otherwise an admin added by an owner.
  const ownsBusiness = useSubscription().subscription?.owns_business ?? false;

  return (
    <Card>
      <View style={styles.headerRow}>
        <View style={[styles.avatar, shadow(theme.primary, 2)]}>
          <Gradient from={theme.primary} to={theme.primaryEnd} />
          <Text style={[styles.avatarText, { color: theme.onPrimary }]}>{initials(admin.full_name)}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>
            {admin.full_name}
          </Text>
          <Text style={[styles.email, { color: theme.textSecondary }]} numberOfLines={2}>
            {admin.email}
          </Text>
          <View style={styles.badges}>
            <Badge icon="checkCircle" label={admin.is_active ? 'Active' : 'Inactive'} color={theme.success} background={theme.successSoft} />
            <Badge icon="crown" label={ownsBusiness ? 'Owner' : 'Admin'} color={theme.primary} background={theme.primarySoft} />
          </View>
        </View>
      </View>
    </Card>
  );
}

function Badge({ icon, label, color, background }: { icon: IconName; label: string; color: string; background: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Icon name={icon} color={color} size={14} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function PersonalInformation({ admin }: { admin: Admin }) {
  const theme = useTheme();
  const { updateAdmin } = useSession();

  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({ full_name: admin.full_name, mobile_no: admin.mobile_no, email: admin.email });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  function startEditing() {
    setValues({ full_name: admin.full_name, mobile_no: admin.mobile_no, email: admin.email });
    setErrors({});
    setFormError('');
    setEditing(true);
  }

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function save() {
    const input = {
      full_name: values.full_name.trim(),
      mobile_no: values.mobile_no.trim(),
      email: values.email.trim().toLowerCase(),
    };
    const nextErrors: Record<string, string> = {};
    if (!input.full_name) nextErrors.full_name = 'Enter your name.';
    if (!isValidMobile(input.mobile_no)) nextErrors.mobile_no = MOBILE_ERROR;
    if (!EMAIL_PATTERN.test(input.email)) nextErrors.email = 'Enter a valid email address.';
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      updateAdmin(await api.updateProfile(input));
      setEditing(false);
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setErrors(e.fieldErrors);
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const editButton = editing ? null : (
    <Pressable accessibilityRole="button" onPress={startEditing} hitSlop={8} style={styles.editButton}>
      <Icon name="edit" color={theme.primary} size={18} />
      <Text style={[styles.editText, { color: theme.primary }]}>Edit</Text>
    </Pressable>
  );

  return (
    <Card title="Personal Information" action={editButton}>
      {editing ? (
        <>
          {formError ? <ErrorBanner message={formError} /> : null}
          <TextField
            label="Name"
            icon="badge"
            autoCapitalize="words"
            value={values.full_name}
            onChangeText={(text) => update('full_name', text)}
            error={errors.full_name}
          />
          <TextField
            label="Email"
            icon="mail"
            autoCapitalize="none"
            keyboardType="email-address"
            value={values.email}
            onChangeText={(text) => update('email', text)}
            error={errors.email}
          />
          <TextField
            label="Mobile"
            icon="phone"
            keyboardType="number-pad"
            maxLength={15}
            value={values.mobile_no}
            onChangeText={(text) => update('mobile_no', text.replace(/\D/g, ''))}
            error={errors.mobile_no}
          />
          <View style={styles.actions}>
            <Button title="Cancel" variant="secondary" style={styles.flex} onPress={() => setEditing(false)} />
            <Button title="Save" icon="check" style={styles.flex} loading={saving} onPress={save} />
          </View>
        </>
      ) : (
        <>
          <InfoRow icon="badge" label="Name" value={admin.full_name} />
          <InfoRow icon="mail" label="Email" value={admin.email} />
          <InfoRow icon="phone" label="Mobile" value={admin.mobile_no} last />
        </>
      )}
    </Card>
  );
}

function InfoRow({ icon, label, value, last = false }: { icon: IconName; label: string; value: string; last?: boolean }) {
  const theme = useTheme();

  return (
    <View style={[styles.infoRow, !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <IconBadge name={icon} tone="primary" />
      <View style={styles.flex}>
        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text }]} selectable>
          {value}
        </Text>
      </View>
    </View>
  );
}

function SecuritySection() {
  const theme = useTheme();
  const { signIn } = useSession();

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({ next: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function close() {
    setValues({ next: '', confirm: '' });
    setErrors({});
    setOpen(false);
  }

  async function changePassword() {
    const nextErrors: Record<string, string> = {};
    if (values.next.length < 8) nextErrors.next = 'Use at least 8 characters.';
    if (values.confirm !== values.next) nextErrors.confirm = "Passwords don't match.";
    setErrors(nextErrors);
    setMessage(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      // Other phones are signed out; keep this one signed in with the fresh token.
      await signIn(await api.changePassword(values.next));
      close();
      setMessage({ text: 'Your password has been updated. Other phones and browsers have been signed out.', success: true });
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setErrors({ next: e.fieldErrors.new_password });
      if (e.message) setMessage({ text: e.message, success: false });
    } finally {
      setSaving(false);
    }
  }

  const toggle = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={open ? 'Hide password form' : 'Change password'}
      accessibilityState={{ expanded: open }}
      onPress={() => (open ? close() : setOpen(true))}
      hitSlop={10}
      style={open && styles.rotated}>
      <Icon name="chevronDown" color={open ? theme.primary : theme.textSecondary} size={22} />
    </Pressable>
  );

  return (
    <Card title="Security" subtitle="Update your account password" action={toggle}>
      {message ? (
        message.success ? (
          <Text style={[styles.success, { color: theme.success }]}>{message.text}</Text>
        ) : (
          <ErrorBanner message={message.text} />
        )
      ) : null}
      {open ? (
        <>
          <TextField
            label="New Password"
            icon="lock"
            password
            placeholder="Enter new password"
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
          <View style={styles.actions}>
            <Button title="Cancel" variant="secondary" style={styles.flex} onPress={close} />
            <Button title="Change" icon="check" style={styles.flex} loading={saving} onPress={changePassword} />
          </View>
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
  },
  dangerIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  flex: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
  },
  email: {
    fontSize: 15,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editText: {
    fontSize: 15,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  rotated: {
    transform: [{ rotate: '180deg' }],
  },
  success: {
    fontSize: 14,
    fontWeight: '600',
  },
});
