import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { SessionProvider, useSession } from '@/lib/session';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    // Lets every form scroll the field being typed into above the keyboard.
    <KeyboardProvider>
      <SessionProvider>
        <RootNavigator />
      </SessionProvider>
    </KeyboardProvider>
  );
}

function RootNavigator() {
  const { admin, isLoading } = useSession();
  const scheme = useColorScheme();
  const theme = useTheme();

  // Keep the splash screen up until the saved session has been read.
  useEffect(() => {
    if (!isLoading) SplashScreen.hide();
  }, [isLoading]);

  if (isLoading) return null;

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
        <Stack.Protected guard={!!admin}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!admin}>
          <Stack.Screen name="login" options={{ animation: 'fade' }} />
          <Stack.Screen name="signup" options={{ animation: 'fade' }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
