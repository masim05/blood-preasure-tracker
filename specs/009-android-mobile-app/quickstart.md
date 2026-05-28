# Quickstart: Android Mobile App

## Scope

This quickstart validates the plan for the Android app feature. Implementation changes must stay under `mobile/android`; API code, API tests, backend tests, and `docs/openapi.yaml` remain unchanged.

## Prerequisites

- Android Studio installed with Android SDK.
- JDK compatible with the selected Android Gradle Plugin.
- Node.js latest active LTS for running the existing API.
- Project dependencies installed with `npm install` at repository root.
- Local API environment configured as documented in the repository README.

## 1. Start Existing API

From repository root:

```bash
npm run api
```

The Android app expects the local API contract from `docs/openapi.yaml`, defaulting to `http://localhost:3000` for local development.

## 2. Open Android Project

Open this directory in Android Studio:

```text
mobile/android
```

The initial scaffold must build and run as a hello world app before user-story implementation proceeds.

## 3. Build Android App

From `mobile/android`:

```bash
./gradlew :app:assembleDebug
```

## 4. Run Unit Tests And Coverage

From `mobile/android`:

```bash
./gradlew :app:testDebugUnitTest
./gradlew :app:koverVerify
```

The Android unit coverage gate is `>= 95%` for implemented mobile code.

## 5. Run Maestro Happy Paths

Start an emulator/device, install the debug app, then run the in-scope flows from `mobile/android`:

```bash
maestro test maestro/us1-signin.yaml
maestro test maestro/us2-guide.yaml
maestro test maestro/us3-login.yaml
maestro test maestro/us4-capture-or-history.yaml
maestro test maestro/us5-history-filter.yaml
```

No US6 flow is required for this feature because measurement detail, image review, value override, and reviewed save are deferred.

## 6. Manual Smoke Checklist

- App opens and displays hello world scaffold before full implementation.
- Signin creates an account and navigates to the guide.
- Guide shows placeholder text asking for a clear picture with tonometer and arm.
- Login authenticates an existing user and navigates to the measurement action screen.
- Measurement action screen opens camera capture and history paths.
- History shows saved measurement rows and applies date filters.
- API errors and network failures are visible to the user on the current screen.
- No files outside `mobile/android` are changed during implementation.
