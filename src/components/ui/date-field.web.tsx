import { createElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toISODate } from '@/lib/dates';

import type { DateFieldProps } from './date-field';

/** The browser's own date picker (a calendar on click), styled like the other fields. */
export function DateField({
  label,
  value,
  onChange,
  required = false,
  error,
  note,
  minimumDate,
  maximumDate,
  clearable = false,
}: DateFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: theme.text }]}>
          {label}
          {required ? <Text style={{ color: theme.danger }}> *</Text> : null}
        </Text>
        {clearable && value ? (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => onChange('')}>
            <Text style={[styles.clear, { color: theme.primary }]}>Clear</Text>
          </Pressable>
        ) : null}
      </View>
      <View
        style={[
          styles.field,
          { backgroundColor: theme.surface, borderColor: error ? theme.danger : theme.border },
        ]}>
        <Icon name="calendar" size={20} color={theme.textSecondary} />
        {createElement('input', {
          type: 'date',
          'aria-label': label,
          value,
          min: minimumDate ? toISODate(minimumDate) : undefined,
          max: maximumDate ? toISODate(maximumDate) : undefined,
          onChange: (event: { target: { value: string } }) => onChange(event.target.value),
          style: {
            flex: 1,
            minWidth: 0,
            height: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: value ? theme.text : theme.textSecondary,
            fontSize: 16,
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            colorScheme: 'light dark',
          },
        })}
      </View>
      {error ? <Text style={[styles.message, { color: theme.danger }]}>{error}</Text> : null}
      {!error && note ? <Text style={[styles.message, { color: theme.textSecondary }]}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  clear: {
    fontSize: 14,
    fontWeight: '600',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    height: 54,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  message: {
    fontSize: 13,
  },
});
