import { useState } from 'react';
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
import { api, ApiError, type MembershipPlan, type MembershipPlanInput } from '@/lib/api';
import { formatDuration, formatMoney } from '@/lib/format';

const fetchDurationTypes = () => api.durationTypes().then(({ results }) => results);

type PlanFormProps = {
  /** The plan being edited; omit to create a new one. */
  plan?: MembershipPlan;
  /** Saves the plan. Throw an ApiError to show its messages on the form. */
  onSubmit: (input: MembershipPlanInput) => Promise<void>;
};

export function PlanForm({ plan, onSubmit }: PlanFormProps) {
  const theme = useTheme();
  const { data: durationTypes, error: loadError, retry } = useResource(fetchDurationTypes);

  const [name, setName] = useState(plan?.name ?? '');
  const [amount, setAmount] = useState(plan ? String(Number(plan.amount)) : '');
  const [durationTypeId, setDurationTypeId] = useState<number | null>(plan?.duration_type.id ?? null);
  const [durationValue, setDurationValue] = useState(plan ? String(plan.duration_value) : '1');
  const [description, setDescription] = useState(plan?.description ?? '');
  const [isActive, setIsActive] = useState(plan?.is_active ?? true);

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!durationTypes) return <LoadingState error={loadError} onRetry={retry} />;

  // New plans default to monthly.
  const selectedType =
    durationTypes.find((type) => type.id === durationTypeId) ??
    durationTypes.find((type) => type.code === 'MONTH') ??
    durationTypes[0];

  async function submit() {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Enter a plan name.';
    if (amount.trim() === '' || !(Number(amount) >= 0)) nextErrors.amount = 'Enter the plan price.';
    if (!/^\d+$/.test(durationValue) || Number(durationValue) < 1) nextErrors.duration_value = 'Enter at least 1.';
    if (!selectedType) nextErrors.duration_type_id = 'Choose a duration.';

    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        amount: Number(amount).toFixed(2),
        duration_type_id: selectedType.id,
        duration_value: Number(durationValue),
        description: description.trim(),
        ...(plan ? { is_active: isActive } : {}),
      });
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setErrors(e.fieldErrors);
      setFormError(e.message || Object.values(e.fieldErrors)[0] || '');
    } finally {
      setSubmitting(false);
    }
  }

  const preview =
    selectedType && Number(durationValue) >= 1 && amount
      ? `${formatDuration(Number(durationValue), selectedType)} for ${formatMoney(amount || 0)}`
      : null;

  return (
    <Screen>
      {formError ? <ErrorBanner message={formError} /> : null}

      <Card title="Plan Details" subtitle={preview ?? 'Members choose from these plans when they join.'}>
        <TextField
          label="Plan Name"
          required
          icon="badge"
          placeholder="e.g. Monthly Gym"
          autoCapitalize="words"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setErrors((current) => ({ ...current, name: undefined }));
          }}
          error={errors.name}
        />
        <TextField
          label="Amount (₹)"
          required
          icon="money"
          placeholder="0"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={(text) => {
            setAmount(text.replace(/[^\d.]/g, ''));
            setErrors((current) => ({ ...current, amount: undefined }));
          }}
          error={errors.amount}
        />

        <View style={styles.durationHeader}>
          <Text style={[styles.label, { color: theme.text }]}>Plan Duration</Text>
        </View>
        <View style={styles.chips}>
          {durationTypes.map((type) => (
            <View key={type.id} style={styles.chip}>
              <Chip label={type.name} selected={type.id === selectedType?.id} onPress={() => setDurationTypeId(type.id)} />
            </View>
          ))}
        </View>
        {errors.duration_type_id ? (
          <Text style={[styles.error, { color: theme.danger }]}>{errors.duration_type_id}</Text>
        ) : null}
        <TextField
          label={`Duration (${selectedType?.name ?? 'units'})`}
          required
          icon="hourglass"
          keyboardType="number-pad"
          maxLength={4}
          value={durationValue}
          onChangeText={(text) => {
            setDurationValue(text.replace(/\D/g, ''));
            setErrors((current) => ({ ...current, duration_value: undefined }));
          }}
          error={errors.duration_value}
        />

        <TextField
          label="Description"
          icon="document"
          placeholder="What's included (optional)"
          multiline
          value={description}
          onChangeText={setDescription}
          error={errors.description}
        />

        {plan ? (
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <Text style={[styles.label, { color: theme.text }]}>Active</Text>
              <Text style={[styles.switchHint, { color: theme.textSecondary }]}>
                Inactive plans can&apos;t be chosen for new members.
              </Text>
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

      <Button title={plan ? 'Save Changes' : 'Submit'} loading={submitting} onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  durationHeader: {
    marginBottom: -Spacing.two,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chip: {
    flex: 1,
  },
  error: {
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
  },
  switchHint: {
    fontSize: 13,
    marginTop: 2,
  },
});
