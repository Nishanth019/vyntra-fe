import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Icon, type IconName } from '@/components/ui/icon';
import { MaxFormWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Full-screen placeholder while the first load is in flight, or its error with a retry. */
export function LoadingState({ error, onRetry }: { error: string; onRetry: () => void }) {
  const theme = useTheme();

  return (
    <View style={styles.centered}>
      {error ? (
        <View style={styles.errorBox}>
          <ErrorBanner message={error} />
          <Button title="Try again" variant="secondary" onPress={onRetry} />
        </View>
      ) : (
        <ActivityIndicator color={theme.primary} size="large" />
      )}
    </View>
  );
}

type EmptyStateProps = {
  icon: IconName;
  title: string;
  message?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.empty}>
      <Icon name={icon} color={theme.textSecondary} size={56} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      {message ? <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>{message}</Text> : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  errorBox: {
    width: '100%',
    maxWidth: MaxFormWidth,
    gap: Spacing.three,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: Spacing.two,
  },
  emptyMessage: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
});
