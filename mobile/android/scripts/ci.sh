#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

./gradlew :app:testDebugUnitTest :app:androidCoverageVerify :app:assembleDebug

command -v maestro >/dev/null 2>&1 || {
  echo "Maestro CLI is required for Android validation. Install it from https://maestro.mobile.dev/getting-started/installing-maestro."
  exit 1
}

maestro test maestro/us1-signin.yaml
maestro test maestro/us2-guide.yaml
maestro test maestro/us3-login.yaml
maestro test maestro/us4-capture-or-history.yaml
maestro test maestro/us5-history-filter.yaml