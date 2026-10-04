import { useSyncExternalStore } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useThemePreference } from '@/lib/theme-preference';

const subscribe = () => () => {};

/** The color scheme to render: the user's choice, or the browser setting when they chose "System". */
export function useColorScheme() {
  // false while server rendering, true once running in the browser.
  const hasHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const preference = useThemePreference();
  const system = useSystemColorScheme();

  // Static rendering can't know the browser setting, so it renders light until hydrated.
  if (!hasHydrated) return 'light';
  return preference === 'system' ? system : preference;
}
