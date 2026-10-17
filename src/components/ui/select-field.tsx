import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SelectFieldProps = {
  label: string;
  /** The chosen value's text; the placeholder shows while empty. */
  value?: string;
  placeholder: string;
  icon?: IconName;
  error?: string;
  onPress: () => void;
};

/** Looks like a text field but opens a picker when tapped. */
export function SelectField({ label, value, placeholder, icon, error, onPress }: SelectFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ?? placeholder}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.field,
          { backgroundColor: theme.surface, borderColor: error ? theme.danger : theme.border },
          pressed && styles.pressed,
        ]}>
        {icon ? <Icon name={icon} color={theme.textSecondary} size={20} /> : null}
        <Text style={[styles.value, { color: value ? theme.text : theme.textSecondary }]} numberOfLines={2}>
          {value ?? placeholder}
        </Text>
        <Icon name="chevronDown" color={theme.textSecondary} size={20} />
      </Pressable>
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    minHeight: 54,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  pressed: {
    opacity: 0.75,
  },
  value: {
    flex: 1,
    fontSize: 16,
  },
  error: {
    fontSize: 13,
  },
});
