#!/bin/sh
# Builds the Android app on this Mac (no EAS cloud build quota needed).
# Uses the same signing key and environment variables as the cloud builds, so it installs over them.
#   ./scripts/build-apk.sh        -> builds/vyntra-<date>.apk (install directly on phones)
#   ./scripts/build-apk.sh aab    -> builds/vyntra-<date>.aab (upload to Google Play)
# Bump android.versionCode in app.json before each new Play Store upload.
set -e
cd "$(dirname "$0")/.."
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home}"
mkdir -p builds
if [ "$1" = "aab" ]; then
  profile=production
  ext=aab
else
  profile=preview
  ext=apk
fi
npx eas-cli build --local --platform android --profile "$profile" --non-interactive \
  --output "builds/vyntra-$(date +%Y%m%d-%H%M).$ext"
