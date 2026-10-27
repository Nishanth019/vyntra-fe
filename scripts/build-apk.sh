#!/bin/sh
# Builds the Android app on this Mac (no EAS cloud build quota needed).
# Signs with the local upload key in credentials.json (gitignored; keystore in ../manaze-secrets). Google Play
# re-signs Play installs with its own app signing key.
#   ./scripts/build-apk.sh        -> builds/manaze-<date>.apk (install directly on phones)
#   ./scripts/build-apk.sh aab    -> builds/manaze-<date>.aab (upload to Google Play)
# Bump android.versionCode in app.json before each new Play Store upload.
set -e
cd "$(dirname "$0")/.."
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home}"
mkdir -p builds
# Android push needs Firebase's google-services.json inside the app. EAS keeps it as a secret file that only its
# cloud builders can read, so local builds use a copy next to this project (gitignored; download it from Firebase:
# project vyntra-10d39 → Project settings → Your apps → com.manaze.app).
if [ -f google-services.json ]; then
  export GOOGLE_SERVICES_JSON="$PWD/google-services.json"
else
  echo "Missing google-services.json: this build will NOT receive push notifications." >&2
  echo "Download it from the Firebase console (project vyntra-10d39) and put it in $(pwd)." >&2
  exit 1
fi
if [ "$1" = "aab" ]; then
  profile=production
  ext=aab
else
  profile=preview
  ext=apk
fi
npx eas-cli build --local --platform android --profile "$profile" --non-interactive \
  --output "builds/manaze-$(date +%Y%m%d-%H%M).$ext"
