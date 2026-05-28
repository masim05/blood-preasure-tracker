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

This scaffold intentionally has no tests. User-story implementation will add tests, Maestro flows, and the 95% Android coverage gate later.
