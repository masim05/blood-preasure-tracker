# Quickstart: Camera Ready Capture

## Prerequisites

1. Android Studio with emulator configured.
2. Android Studio bundled JDK (JBR) used for Gradle.
3. API running locally from repository root.

## Start API

From repository root:

```bash
npm run api
```

## Build Android App

From repository root:

```bash
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" mobile/android/gradlew -p mobile/android :app:assembleDebug
```

## Run Android Unit Tests + Coverage Gate

From repository root:

```bash
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" mobile/android/gradlew -p mobile/android :app:testDebugUnitTest :app:androidCoverageVerify
```

## Validate Maestro US4 Flow

From `mobile/android`:

```bash
MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 maestro test maestro/us4-capture-or-history.yaml
```

## Manual Feature Validation

1. Sign in as existing user and confirm Camera route opens.
2. Verify live preview appears immediately without extra button mode switch.
3. Tap capture once and confirm successful upload navigates to History.
4. Deny camera permission and confirm user-visible error + History action still available.
5. Trigger upload error path and confirm user-visible API error on Camera route.

## Scope Guard

1. Confirm all modified files are under `mobile/android`.
2. Confirm no API code or API test files changed.
