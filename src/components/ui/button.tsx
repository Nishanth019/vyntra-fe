import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: IconName;
  loading?: boolean;
};

export function Button({
  title,
  variant = 'primary',
  icon,
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();

  const colors = {
    primary: { background: theme.primary, border: theme.primary, text: theme.onPrimary },
    secondary: { background: theme.surface, border: theme.border, text: theme.text },
    danger: { background: theme.dangerSoft, border: theme.danger, text: theme.danger },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      style={(state) => [
        styles.button,
        { backgroundColor: colors.background, borderColor: colors.border },
        (state.pressed || disabled) && styles.dimmed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <>
          {icon ? <Icon name={icon} color={colors.text} size={20} /> : null}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    flexDirection: 'row',
    gap: Spacing.two,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  dimmed: {
    opacity: 0.75,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
});
