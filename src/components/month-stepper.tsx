import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** "‹ October 2026 ›": steps one month back or forward (not past this month). */
export function MonthStepper({ label, offset, onChange }: { label: string; offset: number; onChange: (offset: number) => void }) {
  const theme = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Previous month" hitSlop={8} onPress={() => onChange(offset - 1)} style={styles.button}>
        <Icon name="chevronLeft" color={theme.primary} size={22} />
      </Pressable>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next month"
        hitSlop={8}
        disabled={offset >= 0}
        onPress={() => onChange(offset + 1)}
        style={[styles.button, offset >= 0 && styles.disabled]}>
        <Icon name="chevronRight" color={theme.primary} size={22} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.two,
    height: 48,
  },
  button: {
    padding: Spacing.one,
  },
  disabled: {
    opacity: 0.3,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
});
