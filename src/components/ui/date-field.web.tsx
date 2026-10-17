import { StyleSheet, Text, View } from 'react-native';

import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateInput } from '@/lib/dates';

import type { DateFieldProps } from './date-field';

/** Web has no native calendar here: the date is typed as YYYY-MM-DD. */
export function DateField({ label, value, onChange, required, error, note }: DateFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <TextField
        label={label}
        required={required}
        icon="calendar"
        placeholder="YYYY-MM-DD"
        keyboardType="number-pad"
        maxLength={10}
        value={value}
        onChangeText={(text) => onChange(formatDateInput(text))}
        error={error}
      />
      {!error && note ? <Text style={[styles.note, { color: theme.textSecondary }]}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  note: {
    fontSize: 13,
  },
});
