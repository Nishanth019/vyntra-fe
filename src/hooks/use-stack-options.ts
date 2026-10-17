import type { Stack } from 'expo-router';
import type { ComponentProps } from 'react';

import { useTheme } from '@/hooks/use-theme';

type StackOptions = Exclude<NonNullable<ComponentProps<typeof Stack>['screenOptions']>, (...args: never[]) => unknown>;

/** Light header (page background, dark bold title) shared by every stack after login. */
export function useStackOptions(): StackOptions {
  const theme = useTheme();

  return {
    headerStyle: { backgroundColor: theme.background },
    headerTintColor: theme.text,
    headerTitleStyle: { fontWeight: '700', fontSize: 20 },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal',
    contentStyle: { backgroundColor: theme.background },
  };
}
