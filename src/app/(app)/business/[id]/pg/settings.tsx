import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError, type PgSettings } from '@/lib/api';
import { useBusiness } from '@/lib/business';

const TYPES: { value: PgSettings['property_type']; label: string }[] = [
  { value: 'PG', label: 'PG' },
  { value: 'HOSTEL', label: 'Hostel' },
  { value: 'COLIVING', label: 'Co-living' },
];

const GENDERS: { value: PgSettings['gender']; label: string }[] = [
  { value: 'MALE', label: 'Boys' },
  { value: 'FEMALE', label: 'Girls' },
  { value: 'COED', label: 'Co-ed' },
];

export default function PgSettingsScreen() {
  const { account } = useBusiness();
  const fetchSettings = useCallback(() => api.pgSettings(account.id), [account.id]);
  const { data, error, retry } = useResource(fetchSettings);
  if (!data) return <LoadingState error={error} onRetry={retry} />;
  return <SettingsForm settings={data} />;
}

function SettingsForm({ settings }: { settings: PgSettings }) {
  const theme = useTheme();
  const { account } = useBusiness();
  const [values, setValues] = useState({
    property_type: settings.property_type,
    gender: settings.gender,
    prorate_first_bill: settings.prorate_first_bill,
    notice_period_days: String(settings.notice_period_days),
    upi_id: settings.upi_id ?? '',
    house_rules: settings.house_rules ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const set = (patch: Partial<typeof values>) => setValues((current) => ({ ...current, ...patch }));

  async function submit() {
    const days = Number(values.notice_period_days);
    if (!Number.isInteger(days) || days < 0 || days > 365) {
      setErrors({ notice_period_days: 'Use 0 to 365 days.' });
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await api.updatePgSettings(account.id, {
        property_type: values.property_type,
        gender: values.gender,
        prorate_first_bill: values.prorate_first_bill,
        notice_period_days: days,
        upi_id: values.upi_id.trim() || null,
        house_rules: values.house_rules.trim() || null,
      });
      router.back();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setErrors(e.fieldErrors);
      setFormError(e.message || Object.values(e.fieldErrors)[0] || '');
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      {formError ? <ErrorBanner message={formError} /> : null}
      <Card title="Your PG">
        <View style={styles.row}>
          {TYPES.map((type) => (
            <View key={type.value} style={styles.flex}>
              <Chip label={type.label} selected={values.property_type === type.value} onPress={() => set({ property_type: type.value })} />
            </View>
          ))}
        </View>
        <View style={styles.row}>
          {GENDERS.map((gender) => (
            <View key={gender.value} style={styles.flex}>
              <Chip label={gender.label} selected={values.gender === gender.value} onPress={() => set({ gender: gender.value })} />
            </View>
          ))}
        </View>
      </Card>

      <Card title="Rent">
        <View style={styles.switchRow}>
          <View style={styles.flex}>
            <Text style={[styles.label, { color: theme.text }]}>Charge only the days stayed in the first month</Text>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              The default for tenants who join part way through. You can change it for each tenant.
            </Text>
          </View>
          <Switch
            value={values.prorate_first_bill}
            onValueChange={(prorate_first_bill) => set({ prorate_first_bill })}
            trackColor={{ true: theme.primary, false: theme.border }}
            thumbColor={theme.onPrimary}
          />
        </View>
        <TextField
          label="Notice Period (days)"
          icon="calendar"
          keyboardType="number-pad"
          maxLength={3}
          value={values.notice_period_days}
          onChangeText={(text) => set({ notice_period_days: text.replace(/\D/g, '') })}
          error={errors.notice_period_days}
        />
        <TextField
          label="Your UPI ID"
          icon="qr"
          placeholder="e.g. yourname@okaxis"
          autoCapitalize="none"
          value={values.upi_id}
          onChangeText={(upi_id) => set({ upi_id })}
          error={errors.upi_id}
        />
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          Added to WhatsApp rent reminders so tenants can pay you directly.
        </Text>
      </Card>

      <Card title="House Rules" subtitle="Optional. For your own reference and to share with tenants.">
        <TextField
          label="House Rules"
          hideLabel
          multiline
          placeholder={'e.g. Gate closes at 10:30 PM\nNo visitors after 9 PM'}
          maxLength={5000}
          value={values.house_rules}
          onChangeText={(house_rules) => set({ house_rules })}
        />
      </Card>

      {/* Repeated by the button: on a long form the one at the top is out of sight. */}
      {formError ? <ErrorBanner message={formError} /> : null}
      <Button title="Save" icon="check" loading={submitting} onPress={submit} />
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
