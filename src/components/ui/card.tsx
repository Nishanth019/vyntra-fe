import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { IconName } from '@/components/ui/icon';
import { IconBadge, useToneColors, type Tone } from '@/components/ui/icon-badge';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  icon?: IconName;
  /** Tints the card background and border, e.g. the location card or a danger zone. */
  tone?: Tone;
  /** Shown on the right of the header, e.g. an Edit button. */
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
}>;

export function Card({ title, subtitle, icon, tone, action, style, children }: CardProps) {
  const theme = useTheme();
  const toneColors = useToneColors(tone ?? 'primary');

  return (
    <View
      style={[
        styles.card,
        tone
          ? { backgroundColor: toneColors.background, borderColor: toneColors.background }
          : { backgroundColor: theme.surface, borderColor: theme.border },
        style,
      ]}>
      {title ? (
        <View style={styles.header}>
          {icon ? <IconBadge name={icon} tone={tone ?? 'primary'} /> : null}
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: tone === 'danger' ? theme.danger : theme.text }]}>{title}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: tone === 'danger' ? theme.danger : theme.textSecondary }]}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three + 2,
    gap: Spacing.three + 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
});
