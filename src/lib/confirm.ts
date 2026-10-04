import { Alert, Platform } from 'react-native';

/** Asks the user to confirm a destructive action. Resolves to true when they confirm. */
export function confirm(title: string, message: string, confirmLabel: string): Promise<boolean> {
  // Alert.alert ignores buttons on web, so fall back to the browser dialog there.
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
