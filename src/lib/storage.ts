import * as SecureStore from 'expo-secure-store';

// Encrypted storage (Keychain / Keystore). The web build uses storage.web.ts.
export const storage = {
  get: (key: string) => SecureStore.getItemAsync(key),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  remove: (key: string) => SecureStore.deleteItemAsync(key),
};
