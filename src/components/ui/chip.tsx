import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
  /** Shown as a small counter badge, e.g. members in a filter. */
  count?: number;
  /** Fully rounded, for filter rows; option groups use rounded squares. */
  pill?: boolean;
};

/** A selectable option: solid brand color when selected, soft grey otherwise. */
export function Chip({ label, selected, onPress, icon, count, pill = false }: ChipProps) {
  const theme = useTheme();
  const color = selected ? theme.onPrimary : theme.textSecondary;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        pill && styles.pill,
        selected
          ? { backgroundColor: theme.primary, borderColor: theme.primary }
          : { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      {icon ? <Icon name={icon} color={selected ? theme.onPrimary : theme.text} size={18} /> : null}
      <Text
        style={[styles.label, { color: selected ? theme.onPrimary : theme.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}>
        {label}
      </Text>
      {count !== undefined ? (
        <View style={[styles.count, { backgroundColor: selected ? theme.onPrimary : theme.background }]}>
          <Text style={[styles.countText, { color: selected ? theme.primary : color }]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one + 2,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.two,
  },
  pill: {
    minHeight: 42,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  count: {
    minWidth: 24,
    height: 24,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
