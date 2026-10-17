// Push notifications are phone-only; on web these do nothing (notifications still show in the app).

export function getRegisteredPushToken(): string | null {
  return null;
}

export function usePushNotifications(_loggedIn: boolean) {}

export async function registerForPush(): Promise<{ token?: string; problem?: string }> {
  return { problem: 'Push notifications only work on a real phone.' };
}
