import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/icon-badge';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { setThemePreference, useThemePreference, type ThemePreference } from '@/lib/theme-preference';

const OPTIONS: { value: ThemePreference; icon: IconName; title: string; detail: string }[] = [
  { value: 'system', icon: 'system', title: 'System', detail: 'Match your device setting' },
  { value: 'light', icon: 'sun', title: 'Light', detail: 'Always use the light theme' },
  { value: 'dark', icon: 'moon', title: 'Dark', detail: 'Always use the dark theme' },
];

export default function AppearanceScreen() {
  const theme = useTheme();
  const preference = useThemePreference();

  return (
    <Screen title="Theme" subtitle="Choose how Manaze looks on this device.">
      {OPTIONS.map((option) => {
        const selected = option.value === preference;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => setThemePreference(option.value)}
            style={({ pressed }) => [
              styles.option,
              { backgroundColor: theme.surface, borderColor: selected ? theme.primary : theme.border },
              pressed && styles.pressed,
            ]}>
            <IconBadge name={option.icon} tone={selected ? 'primary' : 'neutral'} />
            <View style={styles.flex}>
              <Text style={[styles.title, { color: theme.text }]}>{option.title}</Text>
              <Text style={[styles.detail, { color: theme.textSecondary }]}>{option.detail}</Text>
            </View>
            {selected ? <Icon name="check" color={theme.primary} size={22} /> : null}
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1.5,
    borderRadius: Radius.lg,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  detail: {
    fontSize: 14,
    marginTop: 2,
  },
});
