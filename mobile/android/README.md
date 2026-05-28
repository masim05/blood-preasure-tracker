# Blood Pressure Tracker Android

Android Studio project for the Blood Pressure Tracker mobile app. The UI uses Jetpack Compose Material 3 for the combined Login/New Account screen, guide, camera, and history journey.

## Open

Open this directory in Android Studio:

```text
mobile/android
```

Android Studio should sync the Gradle project and let you run the `app` configuration on an emulator or device. On first open, allow Android Studio to use the installed Android SDK and download the Gradle/Android plugin dependencies declared by this project.

Use Android Studio's bundled JDK as the Gradle JDK. The project targets JVM 17 for app code, and the Gradle/Kotlin DSL toolchain is not compatible with a Java 25 default runtime.

## Build

Build from the repository root with the Android Gradle wrapper:

```bash
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" mobile/android/gradlew -p mobile/android :app:assembleDebug
```

The app targets the local API at `http://10.0.2.2:3000` for emulator validation. Start the API from the repository root with:

```bash
npm run api
```

## Test And Coverage

Run Android unit tests and the 95% coverage gate from the repository root:

```bash
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" mobile/android/gradlew -p mobile/android :app:testDebugUnitTest :app:androidCoverageVerify
```

Run the Android-only validation script from `mobile/android`:

```bash
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" scripts/ci.sh
```

## Maestro

The happy-path flows for US1 through US5 live under `mobile/android/maestro` and use stable Compose semantics/resource IDs instead of visible text selectors. Start the API on `http://localhost:3000`, install the debug app on an emulator, then run:

```bash
MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 maestro test maestro/us1-signin.yaml
MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 maestro test maestro/us2-guide.yaml
MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 maestro test maestro/us3-login.yaml
MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 maestro test maestro/us4-capture-or-history.yaml
MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 maestro test maestro/us5-history-filter.yaml
```
