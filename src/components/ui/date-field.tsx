import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, parseISODate, toISODate } from '@/lib/dates';

export type DateFieldProps = {
  label: string;
  /** `YYYY-MM-DD`, or '' when empty. */
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  /** Shown under the field, e.g. "starts after the current plan". */
  note?: string;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  /** Shows a Clear action for optional dates. */
  clearable?: boolean;
  /** Short date and no arrow, for narrow side-by-side fields. */
  compact?: boolean;
};

/** e.g. "17 Oct 26". */
function shortDate(value: string) {
  return parseISODate(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

/** A date input that opens the phone's calendar. */
export function DateField({
  label,
  value,
  onChange,
  required = false,
  error,
  note,
  placeholder = 'Select date',
  minimumDate,
  maximumDate,
  clearable = false,
  compact = false,
}: DateFieldProps) {
  const theme = useTheme();
  const [iosOpen, setIosOpen] = useState(false);
  const [iosDate, setIosDate] = useState(new Date());
  const current = value ? parseISODate(value) : new Date();

  function open() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        minimumDate,
        maximumDate,
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(toISODate(date));
        },
      });
    } else {
      setIosDate(current);
      setIosOpen(true);
    }
  }

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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDate(value) : 'not set'}`}
        onPress={open}
        style={[
          styles.field,
          compact && styles.compactField,
          { backgroundColor: theme.surface, borderColor: error ? theme.danger : theme.border },
        ]}>
        <Icon name="calendar" size={compact ? 18 : 20} color={theme.textSecondary} />
        <Text
          style={[styles.value, { color: value ? theme.text : theme.textSecondary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}>
          {value ? (compact ? shortDate(value) : formatDate(value)) : placeholder}
        </Text>
        {compact ? null : <Icon name="chevronDown" size={18} color={theme.textSecondary} />}
      </Pressable>
      {error ? <Text style={[styles.message, { color: theme.danger }]}>{error}</Text> : null}
      {!error && note ? <Text style={[styles.message, { color: theme.textSecondary }]}>{note}</Text> : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={iosOpen} transparent animationType="fade" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setIosOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
            <DateTimePicker
              value={iosDate}
              mode="date"
              display="inline"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onChange={(_, date) => date && setIosDate(date)}
            />
            <Button
              title="Done"
              onPress={() => {
                onChange(toISODate(iosDate));
                setIosOpen(false);
              }}
            />
          </View>
        </Modal>
      ) : null}
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
  compactField: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.two + 2,
  },
  value: {
    flex: 1,
    fontSize: 16,
  },
  message: {
    fontSize: 13,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    padding: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
});
