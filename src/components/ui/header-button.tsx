import { Pressable, StyleSheet } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Radius, shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type HeaderButtonProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  /** A solid brand circle, for the screen's main action (e.g. add). */
  filled?: boolean;
};

/** A round icon button for headers. */
export function HeaderButton({ icon, label, onPress, filled = false }: HeaderButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        filled
          ? [{ backgroundColor: theme.primary }, shadow(theme.primary, 2)]
          : [{ backgroundColor: theme.surface }, shadow(theme.shadow)],
        pressed && styles.pressed,
      ]}>
      <Icon name={icon} color={filled ? theme.onPrimary : theme.text} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
