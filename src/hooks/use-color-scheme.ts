import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useThemePreference } from '@/lib/theme-preference';

/** The color scheme to render: the user's choice, or the device setting when they chose "System". */
export function useColorScheme() {
  const preference = useThemePreference();
  const system = useSystemColorScheme();

  return preference === 'system' ? system : preference;
}
