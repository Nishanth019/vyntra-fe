import type { PropsWithChildren } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MaxFormWidth, Spacing } from '@/constants/theme';
import { useKeyboardInset } from '@/hooks/use-keyboard-inset';
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
  const keyboard = useKeyboardInset();

  return (
    <View style={[styles.container, { paddingBottom: keyboard }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          ) : undefined
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three + 4,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.three + 2,
  },
  heading: {
    gap: Spacing.one,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
});
