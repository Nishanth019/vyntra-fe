import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { HeaderButton } from '@/components/ui/header-button';
import { useStackOptions } from '@/hooks/use-stack-options';
import { usePushNotifications } from '@/lib/push';
import { useSession } from '@/lib/session';

/** Screens for a logged-in admin. The root layout only renders this group when there's a session. */
export default function AppLayout() {
  const stackOptions = useStackOptions();
  const { admin, signOut } = useSession();
  usePushNotifications(Boolean(admin));

  const logout = () => <HeaderButton icon="logout" label="Log out" onPress={signOut} />;

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={stackOptions}>
        <Stack.Screen name="index" options={{ title: 'Vyntra', headerRight: logout }} />
        <Stack.Screen name="accounts/index" options={{ title: 'Your Organisations', headerRight: logout }} />
        <Stack.Screen name="accounts/new" options={{ title: 'Add Organisation' }} />
        <Stack.Screen name="profile" options={{ title: 'My Profile' }} />
        <Stack.Screen name="help" options={{ title: 'Help & FAQs' }} />
        <Stack.Screen name="contact" options={{ title: 'Contact Us' }} />
        <Stack.Screen name="appearance" options={{ title: 'Theme' }} />
        {/* The business section has its own stack and header. */}
        <Stack.Screen name="business/[id]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
