#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

./gradlew :app:testDebugUnitTest :app:androidCoverageVerify :app:assembleDebug

command -v maestro >/dev/null 2>&1 || {
  echo "Maestro CLI is required for Android validation. Install it from https://maestro.mobile.dev/getting-started/installing-maestro."
  exit 1
}

MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 maestro test maestro/us1-signin.yaml
MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 maestro test maestro/us2-guide.yaml
MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 maestro test maestro/us3-login.yaml
MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 maestro test maestro/us4-capture-or-history.yaml
MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 maestro test maestro/us5-history-filter.yaml
MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 maestro test maestro/us6-measurement-detail.yaml
MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 maestro test maestro/us7-language-selection.yaml