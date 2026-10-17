import type { ConfigContext, ExpoConfig } from 'expo/config';

// app.json holds the config; this only adds the Firebase file for Android push.
// The repo is public, so google-services.json isn't committed: EAS builds get it from the
// GOOGLE_SERVICES_JSON secret file variable (expo.dev → Environment variables).
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
  },
});
