import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import { api, ApiError, setAuthToken, setUnauthorizedHandler, type Admin, type AuthResponse } from '@/lib/api';
import { storage } from '@/lib/storage';
import { loadThemePreference } from '@/lib/theme-preference';

const TOKEN_KEY = 'access_token';
const ADMIN_KEY = 'admin';

type SessionContextValue = {
  admin: Admin | null;
  isLoading: boolean;
  signIn: (response: AuthResponse) => Promise<void>;
  signOut: () => void;
  /** Saves an updated profile, e.g. after editing it. */
  updateAdmin: (admin: Admin) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession() {
  const value = use(SessionContext);
  if (!value) throw new Error('useSession must be used inside <SessionProvider>');
  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function signOut() {
    setAuthToken(null);
    setAdmin(null);
    storage.remove(TOKEN_KEY);
    storage.remove(ADMIN_KEY);
    api.logout().catch(() => {});
  }

  async function signIn({ admin, access_token }: AuthResponse) {
    await storage.set(TOKEN_KEY, access_token);
    await storage.set(ADMIN_KEY, JSON.stringify(admin));
    setAuthToken(access_token);
    setAdmin(admin);
  }

  function updateAdmin(updated: Admin) {
    setAdmin(updated);
    storage.set(ADMIN_KEY, JSON.stringify(updated));
  }

  useEffect(() => {
    setUnauthorizedHandler(signOut);

    // Restore the saved session (and theme, so the first screen renders in the right colors)
    // so the app opens straight in, then refresh the profile in the background.
    (async () => {
      const [token, savedAdmin] = await Promise.all([
        storage.get(TOKEN_KEY),
        storage.get(ADMIN_KEY),
        loadThemePreference(),
      ]);
      if (!token || !savedAdmin) {
        setIsLoading(false);
        return;
      }
      setAuthToken(token);
      setAdmin(JSON.parse(savedAdmin));
      setIsLoading(false);

      try {
        updateAdmin(await api.me());
      } catch (error) {
        // A 401 already signed us out; offline keeps the saved profile.
        if (!(error instanceof ApiError)) throw error;
      }
    })();

    return () => setUnauthorizedHandler(null);
  }, []);

  return <SessionContext value={{ admin, isLoading, signIn, signOut, updateAdmin }}>{children}</SessionContext>;
}
