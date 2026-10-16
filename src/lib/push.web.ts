// Push notifications are phone-only; on web these do nothing (notifications still show in the app).

export function getRegisteredPushToken(): string | null {
  return null;
}

export function usePushNotifications(_loggedIn: boolean) {}
