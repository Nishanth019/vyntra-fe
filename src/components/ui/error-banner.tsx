import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function ErrorBanner({ message }: { message: string }) {
  const theme = useTheme();

  return (
    <View accessibilityRole="alert" style={[styles.banner, { backgroundColor: theme.dangerSoft }]}>
      <Text style={[styles.text, { color: theme.danger }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - 2,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});
