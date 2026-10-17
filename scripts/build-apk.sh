#!/bin/sh
# Builds the installable Android APK on this Mac (no EAS cloud build quota needed).
# Uses the same signing key and environment variables as the cloud builds, so it installs over them.
# Output: builds/vyntra-<date>.apk
set -e
cd "$(dirname "$0")/.."
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home}"
mkdir -p builds
npx eas-cli build --local --platform android --profile preview --non-interactive \
  --output "builds/vyntra-$(date +%Y%m%d-%H%M).apk"
