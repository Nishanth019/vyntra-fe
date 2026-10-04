import { useSyncExternalStore } from 'react';
import { Appearance, Platform } from 'react-native';

import { storage } from '@/lib/storage';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme_preference';

let current: ThemePreference = 'system';
const listeners = new Set<() => void>();

function apply(preference: ThemePreference) {
  current = preference;
  // Also tells native UI (keyboard, alerts) which scheme to use; web has no equivalent.
  if (Platform.OS !== 'web') Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  listeners.forEach((listener) => listener());
}

export function setThemePreference(preference: ThemePreference) {
  apply(preference);
  storage.set(STORAGE_KEY, preference);
}

/** Restores the saved choice; call once at startup. */
export async function loadThemePreference() {
  const saved = await storage.get(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') apply(saved);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useThemePreference() {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => 'system' as const,
  );
}
