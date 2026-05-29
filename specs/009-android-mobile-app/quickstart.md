# Quickstart: Android Mobile App

## Scope

This quickstart validates the plan for the Android app feature. Implementation changes must stay under `mobile/android`; API code, API tests, backend tests, and `docs/openapi.yaml` remain unchanged.

## Prerequisites

- Android Studio installed with Android SDK.
- Android Studio bundled JDK/JBR or another JDK compatible with Android Gradle Plugin 8.7.3.
- Node.js latest active LTS for running the existing API.
- Project dependencies installed with `npm install` at repository root.
- Local API environment configured as documented in the repository README.
- Implementation work performed from `tmp/009-android-mobile-app` or with an explicit maintainer waiver for worktree isolation.

## 1. Start Existing API

From repository root:

```bash
npm run api
```

The Android app expects the local API contract from `docs/openapi.yaml`. Android emulator validation uses `http://10.0.2.2:3000` to reach the host API.

## 2. Open Android Project

Open this directory in Android Studio:

```text
mobile/android
```

The initial scaffold must build and run before user-story implementation proceeds.

## 3. Build Android App

From `mobile/android`:

```bash
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew :app:assembleDebug
```

## 4. Run Unit Tests And Coverage

From `mobile/android`:

```bash
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew :app:testDebugUnitTest
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew :app:androidCoverageVerify
```

The Android unit coverage gate is `>= 95%` for implemented mobile code.

## 5. Run Maestro Happy Paths

Start an emulator/device, install the debug app, then run the in-scope flows from `mobile/android`:

```bash
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew :app:installDebug
MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 maestro test maestro/us1-signin.yaml
MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 maestro test maestro/us2-guide.yaml
MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 maestro test maestro/us3-login.yaml
MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 maestro test maestro/us4-capture-or-history.yaml
MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 maestro test maestro/us5-history-filter.yaml
MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 maestro test maestro/us6-measurement-detail.yaml
```

US6 validates the history-to-detail journey, editable recognized values, Save, and Back to history using the existing API contract.

## 6. Manual Smoke Checklist

- App opens and displays the combined Login/New Account auth screen.
- New Account mode creates an account and navigates to the guide.
- Signin and login password fields use Android standard password masking behavior.
- Guide shows placeholder text asking for a clear picture with tonometer and arm.
- Guide Next opens the camera screen.
- Login mode authenticates an existing user and navigates directly to the camera screen.
- Camera screen provides image capture/upload and History actions.
- Successful upload opens history.
- History shows saved measurement rows in vertically aligned columns.
- History applies date filters through date selector controls rather than free-text inputs.
- Tapping a history row opens measurement detail; Back returns to history.
- API errors and network failures are visible to the user on the current screen.
- Android screens use Jetpack Compose Material 3 layouts and localized visible strings.
- No files outside `mobile/android` are changed during implementation, except Spec Kit planning artifacts when running planning commands.
