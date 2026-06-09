#!/usr/bin/env sh
set -eu

PROJECT_PATH="mobile/ios/Blood pressure tracker/Blood pressure tracker.xcodeproj"
SCHEME="Blood pressure tracker"
DEFAULT_TEST_TARGET="Blood pressure trackerTests"

# Allow an override while keeping a sensible default for local unit testing.
TEST_TARGET="${IOS_TEST_TARGET:-$DEFAULT_TEST_TARGET}"
DESTINATION="${IOS_DESTINATION:-}"

if [ -z "$DESTINATION" ]; then
  DESTINATION="$(xcrun simctl list devices available | awk '/iPhone/ { sub(/^ +/, "", $0); split($0, parts, " \\("); print "platform=iOS Simulator,name=" parts[1]; exit }')"
fi

if [ -z "$DESTINATION" ]; then
  echo "No available iPhone simulator found. Install a simulator in Xcode and try again."
  exit 1
fi

echo "Running iOS tests on: $DESTINATION"

MAX_ATTEMPTS="${IOS_TEST_MAX_ATTEMPTS:-2}"
ATTEMPT=1

while [ "$ATTEMPT" -le "$MAX_ATTEMPTS" ]; do
  echo "xcodebuild test attempt $ATTEMPT/$MAX_ATTEMPTS"

  if xcodebuild test \
    -project "$PROJECT_PATH" \
    -scheme "$SCHEME" \
    -destination "$DESTINATION" \
    -parallel-testing-enabled NO \
    -maximum-parallel-testing-workers 1 \
    -only-testing:"$TEST_TARGET"; then
    exit 0
  fi

  if [ "$ATTEMPT" -ge "$MAX_ATTEMPTS" ]; then
    exit 1
  fi

  echo "Retrying after simulator reset..."
  xcrun simctl shutdown all >/dev/null 2>&1 || true
  ATTEMPT=$((ATTEMPT + 1))
done
