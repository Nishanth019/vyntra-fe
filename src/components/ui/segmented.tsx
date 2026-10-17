import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SegmentedProps<T extends string> = {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
};

/** A row of equal tabs on a soft track; the selected one is solid brand color. */
export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const theme = useTheme();

  return (
    <View style={[styles.track, { backgroundColor: theme.border }]}>
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.key)}
            style={[styles.option, selected && [{ backgroundColor: theme.primary }, shadow(theme.primary, 2)]]}>
            <Text
              style={[styles.label, { color: selected ? theme.onPrimary : theme.textSecondary }]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.md,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.sm,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});
