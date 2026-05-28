#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

./gradlew :app:testDebugUnitTest :app:koverVerify :app:assembleDebug

if command -v maestro >/dev/null 2>&1; then
  maestro test maestro/us1-signin.yaml
  maestro test maestro/us2-guide.yaml
  maestro test maestro/us3-login.yaml
  maestro test maestro/us4-capture-or-history.yaml
  maestro test maestro/us5-history-filter.yaml
else
  echo "Maestro CLI is not installed; skipping local Maestro execution."
fi