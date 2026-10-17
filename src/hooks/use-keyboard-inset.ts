import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * How much of the bottom of the screen the keyboard covers on Android. The app draws edge-to-edge,
 * so Android no longer shrinks the screen for the keyboard; screens pad their bottom by this instead
 * (the scroll view then keeps the focused field in view). iOS handles this in the scroll view itself.
 */
export function useKeyboardInset() {
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', (event) => setHeight(event.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // The reported height leaves out the navigation bar the keyboard also sits over.
  return height > 0 ? height + insets.bottom : 0;
}
