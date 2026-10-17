import { ActivityIndicator, Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';

import { Gradient } from '@/components/ui/gradient';
import { Icon, type IconName } from '@/components/ui/icon';
import { Radius, shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  /** `danger` is outlined red; `destructive` is solid red for the final, irreversible action. */
  variant?: 'primary' | 'secondary' | 'danger' | 'destructive';
  icon?: IconName;
  /** Icon after the title, e.g. an arrow on "Log in". */
  trailingIcon?: IconName;
  loading?: boolean;
};

export function Button({
  title,
  variant = 'primary',
  icon,
  trailingIcon,
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();

  const colors = {
    primary: { background: theme.primary, border: theme.primary, text: theme.onPrimary },
    secondary: { background: theme.surface, border: theme.border, text: theme.text },
    danger: { background: theme.surface, border: theme.danger, text: theme.danger },
    destructive: { background: theme.danger, border: theme.danger, text: theme.onPrimary },
  }[variant];
  const iconColor = variant === 'secondary' ? theme.primary : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      style={(state) => [
        styles.button,
        { backgroundColor: colors.background, borderColor: colors.border },
        variant === 'primary' && shadow(theme.primary, 2),
        (state.pressed || disabled) && styles.dimmed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {variant === 'primary' ? (
        <View style={styles.fill}>
          <Gradient from={theme.primary} to={theme.primaryEnd} />
        </View>
      ) : null}
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <>
          {icon ? <Icon name={icon} color={iconColor} size={20} /> : null}
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {title}
          </Text>
          {trailingIcon ? <Icon name={trailingIcon} color={iconColor} size={20} /> : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    flexDirection: 'row',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  fill: {
    position: 'absolute',
    top: -1,
    right: -1,
    bottom: -1,
    left: -1,
    borderRadius: Radius.md + 1,
    overflow: 'hidden',
  },
  dimmed: {
    opacity: 0.75,
  },
  title: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '700',
  },
});
