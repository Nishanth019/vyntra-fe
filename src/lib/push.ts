import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { api } from '@/lib/api';
import { openNotificationTarget } from '@/lib/notification-target';

// Show notifications that arrive while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let registeredToken: string | null = null;

/** The token this phone registered with, so logout can unregister it. */
export function getRegisteredPushToken() {
  return registeredToken;
}

/**
 * Asks for permission and registers this phone for the admin's push notifications.
 * Returns the token, or a reason it couldn't register.
 */
export async function registerForPush(): Promise<{ token?: string; problem?: string }> {
  if (!Device.isDevice || Platform.OS === 'web') return { problem: 'Push notifications only work on a real phone.' };

  // Android 13+ only shows the permission prompt once a channel exists.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  const granted = existing.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return { problem: 'Notifications are turned off for Vyntra. Allow them in your phone settings.' };

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await api.registerDevice(token, Platform.OS);
  registeredToken = token;
  return { token };
}

/** Registers for push once logged in, and opens the right screen when a notification is tapped. */
export function usePushNotifications(loggedIn: boolean) {
  useEffect(() => {
    // Push setup must never block or crash the app (e.g. no Firebase config yet, offline).
    if (loggedIn) registerForPush().catch(() => {});
  }, [loggedIn]);

  const lastResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!loggedIn || !lastResponse || lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const data = lastResponse.notification.request.content.data as {
      business_account_id?: number;
      member_id?: number | null;
      member_filter?: string | null;
      open?: string;
    };
    if (data?.open === 'subscription') router.push('/subscription');
    else if (data?.business_account_id) openNotificationTarget(data.business_account_id, data);
    Notifications.clearLastNotificationResponseAsync().catch(() => {});
  }, [loggedIn, lastResponse]);
}
