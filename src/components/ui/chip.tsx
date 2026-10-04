import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Second line, e.g. a plan's price. */
  detail?: string;
  /** Shown as a small counter badge, e.g. members in a filter. */
  count?: number;
};

/** A selectable pill for single-choice options. */
export function Chip({ label, selected, onPress, detail, count }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected
          ? { backgroundColor: theme.primarySoft, borderColor: theme.primary }
          : { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.label, { color: selected ? theme.primary : theme.text }]}>{label}</Text>
      {detail ? <Text style={[styles.detail, { color: theme.textSecondary }]}>{detail}</Text> : null}
      {count !== undefined ? (
        <View style={[styles.count, { backgroundColor: selected ? theme.primary : theme.primarySoft }]}>
          <Text style={[styles.countText, { color: selected ? theme.onPrimary : theme.primary }]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    alignItems: 'center',
    gap: 2,
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  detail: {
    fontSize: 13,
  },
  count: {
    minWidth: 28,
    height: 28,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
