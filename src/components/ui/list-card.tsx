import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ListCardProps = {
  title: string;
  subtitle?: string | null;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

/** A tappable row with an initial badge, e.g. a business type or a business account. */
export function ListCard({ title, subtitle, onPress, loading = false, disabled = false }: ListCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        (pressed || disabled) && styles.dimmed,
      ]}>
      <View style={[styles.badge, { backgroundColor: theme.primarySoft }]}>
        <Text style={[styles.badgeText, { color: theme.primary }]}>{title.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {loading ? (
        <ActivityIndicator color={theme.primary} />
      ) : (
        <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
  dimmed: {
    opacity: 0.7,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 20,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  chevron: {
    fontSize: 26,
    fontWeight: '300',
  },
});
