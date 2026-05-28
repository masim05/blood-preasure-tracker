# Blood Pressure Tracker Android

Minimal Android Studio project for the Blood Pressure Tracker mobile app.

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

## Test And Coverage

Run Android unit tests and the 95% coverage gate from the repository root:

```bash
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" mobile/android/gradlew -p mobile/android :app:testDebugUnitTest :app:koverVerify
```

Run the Android-only validation script from `mobile/android`:

```bash
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" scripts/ci.sh
```

## Maestro

The happy-path flows for US1 through US5 live under `mobile/android/maestro` and use stable resource IDs instead of visible text selectors. Install the debug app on an emulator, then run:

```bash
maestro test maestro/us1-signin.yaml
maestro test maestro/us2-guide.yaml
maestro test maestro/us3-login.yaml
maestro test maestro/us4-capture-or-history.yaml
maestro test maestro/us5-history-filter.yaml
```
