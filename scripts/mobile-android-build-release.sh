#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
android_root="$repo_root/mobile/android"
app_gradle_file="$android_root/app/build.gradle.kts"
release_dir="$android_root/app/release"
unsigned_apk="$android_root/app/build/outputs/apk/release/app-release-unsigned.apk"
keystore="$HOME/.android-key-store/blood-pressure-tracker-release.jks"

if command -v /usr/libexec/java_home >/dev/null 2>&1; then
  export JAVA_HOME="$(/usr/libexec/java_home -v 17)"
  export PATH="$JAVA_HOME/bin:$PATH"
fi

version_code="$(node -e 'const fs=require("fs"); const file=process.argv[1]; const contents=fs.readFileSync(file,"utf8"); const match=contents.match(/versionCode\s*=\s*(\d+)/); if(!match) process.exit(1); process.stdout.write(match[1]);' "$app_gradle_file")"
version_name="$(node -e 'const fs=require("fs"); const file=process.argv[1]; const contents=fs.readFileSync(file,"utf8"); const match=contents.match(/versionName\s*=\s*"([^"]+)"/); if(!match) process.exit(1); process.stdout.write(match[1]);' "$app_gradle_file")"

if [[ ! -f "$keystore" ]]; then
  echo "Signing keystore not found: $keystore" >&2
  exit 1
fi

build_tools="$(find "$HOME/Library/Android/sdk/build-tools" -mindepth 1 -maxdepth 1 -type d | sort -V | tail -1)"

if [[ -z "$build_tools" ]]; then
  echo "No Android build-tools found under $HOME/Library/Android/sdk/build-tools" >&2
  exit 1
fi

mkdir -p "$release_dir"

cd "$android_root"
./gradlew clean assembleRelease

if [[ ! -f "$unsigned_apk" ]]; then
  echo "Release APK not found: $unsigned_apk" >&2
  exit 1
fi

aligned_apk="$release_dir/blood-pressure-tracker-${version_name}-v${version_code}-aligned.apk"
signed_apk="$release_dir/blood-pressure-tracker-${version_name}-v${version_code}-release.apk"

"$build_tools/zipalign" -f -p 4 "$unsigned_apk" "$aligned_apk"

printf 'Store password: '
read -r -s store_password
printf '\nKey password: '
read -r -s key_password
printf '\n'

"$build_tools/apksigner" sign \
  --ks "$keystore" \
  --ks-key-alias blood-pressure-tracker \
  --ks-pass "pass:$store_password" \
  --key-pass "pass:$key_password" \
  --out "$signed_apk" \
  "$aligned_apk"

"$build_tools/apksigner" verify \
  --verbose \
  --print-certs \
  "$signed_apk"

printf '%s\n' "$signed_apk"