import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'accent' | 'neutral';

/** Foreground and soft background colors for a tone. */
export function useToneColors(tone: Tone) {
  const theme = useTheme();
  return {
    primary: { color: theme.primary, background: theme.primarySoft },
    success: { color: theme.success, background: theme.successSoft },
    warning: { color: theme.warning, background: theme.warningSoft },
    danger: { color: theme.danger, background: theme.dangerSoft },
    accent: { color: theme.accent, background: theme.accentSoft },
    neutral: { color: theme.textSecondary, background: theme.background },
  }[tone];
}

/** An icon on a soft rounded square, as used in card headers and menu rows. */
export function IconBadge({ name, tone = 'primary', size = 44 }: { name: IconName; tone?: Tone; size?: number }) {
  const { color, background } = useToneColors(tone);

  return (
    <View style={[styles.badge, { width: size, height: size, backgroundColor: background }]}>
      <Icon name={name} color={color} size={Math.round(size * 0.5)} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
