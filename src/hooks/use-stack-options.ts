import type { Stack } from 'expo-router';
import type { ComponentProps } from 'react';

import { useTheme } from '@/hooks/use-theme';

type StackOptions = Exclude<NonNullable<ComponentProps<typeof Stack>['screenOptions']>, (...args: never[]) => unknown>;

/** Brand-colored header shared by every stack after login. */
export function useStackOptions(): StackOptions {
  const theme = useTheme();

  return {
    headerStyle: { backgroundColor: theme.primary },
    headerTintColor: theme.onPrimary,
    headerTitleStyle: { fontWeight: '600' },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal',
    contentStyle: { backgroundColor: theme.background },
  };
}
