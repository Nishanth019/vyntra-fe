import { createContext, use, useCallback, useEffect, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';

import { api, ApiError, setPaymentRequiredHandler, type BusinessAccess, type SubscriptionInfo } from '@/lib/api';

type SubscriptionContextValue = {
  /** The logged-in login's own trial or plan; null until first loaded. */
  subscription: SubscriptionInfo | null;
  refresh: () => Promise<void>;
  /** Saves fresh data returned by a purchase or cancel call. */
  setSubscription: (info: SubscriptionInfo) => void;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function useSubscription() {
  const value = use(SubscriptionContext);
  if (!value) throw new Error('useSubscription must be used inside <SubscriptionProvider>');
  return value;
}

/** Loads the subscription after login and again whenever the app comes back to the foreground. */
export function SubscriptionProvider({ children }: PropsWithChildren) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

  const refresh = useCallback(
    () =>
      api.subscription().then(setSubscription, (error) => {
        // Offline or signed out: keep what we have.
        if (!(error instanceof ApiError)) throw error;
      }),
    [],
  );

  useEffect(() => {
    refresh();
    setPaymentRequiredHandler(refresh);
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      setPaymentRequiredHandler(null);
      listener.remove();
    };
  }, [refresh]);

  return <SubscriptionContext value={{ subscription, refresh, setSubscription }}>{children}</SubscriptionContext>;
}

/**
 * Whether a business is read-only right now. For the owner it follows their own subscription, which is
 * kept fresh, so subscribing unlocks the business at once; other admins see what was loaded with it.
 */
export function isReadOnly(access: BusinessAccess | null | undefined, subscription: SubscriptionInfo | null) {
  if (access?.is_owner && subscription) return !subscription.has_access;
  return Boolean(access?.read_only);
}
