import { Platform, useWindowDimensions } from 'react-native';

/** A desktop browser window: show the menu as a fixed sidebar instead of the phone layout. */
export function useWideLayout() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= 1024;
}
