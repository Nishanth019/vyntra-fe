import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useToneColors, type Tone } from '@/components/ui/icon-badge';
import { Radius, shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  /** Tints the card background, e.g. a danger zone. */
  tone?: Tone;
  /** Shown on the right of the header, e.g. an Edit button. */
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
}>;

/** A white rounded section with an optional title and subtitle. */
export function Card({ title, subtitle, tone, action, style, children }: CardProps) {
  const theme = useTheme();
  const toneColors = useToneColors(tone ?? 'primary');

  return (
    <View
      style={[
        styles.card,
        tone
          ? { backgroundColor: toneColors.background, borderColor: toneColors.background }
          : [{ backgroundColor: theme.surface, borderColor: theme.border }, shadow(theme.shadow)],
        style,
      ]}>
      {title ? (
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: tone === 'danger' ? theme.danger : theme.text }]}>{title}</Text>
            {subtitle ? <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text> : null}
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
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Spacing.three + 4,
    gap: Spacing.three,
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
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
});
