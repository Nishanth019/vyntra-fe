import type { PropsWithChildren } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MaxFormWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  /** Enables pull-to-refresh. */
  onRefresh?: () => void;
  refreshing?: boolean;
  maxWidth?: number;
}>;

/** Scrollable page body with an optional heading, centered and width-capped for tablets and web. */
export function Screen({
  title,
  subtitle,
  onRefresh,
  refreshing = false,
  maxWidth = MaxFormWidth,
  children,
}: ScreenProps) {
  const theme = useTheme();

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} /> : undefined
      }>
      <View style={[styles.content, { maxWidth }]}>
        {title ? (
          <View style={styles.heading}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            {subtitle ? <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text> : null}
          </View>
        ) : null}
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.four,
  },
  heading: {
    gap: Spacing.two,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
});
