# Research: Android Mobile App

## Decision: Use a standalone Android project rooted at `mobile/android`

**Rationale**: The specification and constitution require all implementation changes for this feature to live under `mobile/android`. A standalone Android project lets Android Studio open, build, test, and run the app without touching existing API/backend files.

**Alternatives considered**: Placing Android code under `android/` or adding root-level Gradle files was rejected because it violates the mobile-only path constraint.

## Decision: Treat Kotlin LTS as latest stable Android-compatible Kotlin

**Rationale**: Kotlin does not publish a separate conventional LTS channel. To satisfy the constitution in an actionable way, implementation will pin the latest stable Kotlin version supported by the selected Android Gradle Plugin inside `mobile/android`.

**Alternatives considered**: Leaving the Kotlin version unresolved was rejected because planning must be actionable. Pinning an outdated Kotlin version was rejected because the user asked for the latest LTS/stable baseline.

## Decision: Use Jetpack Compose with Material 3 and Navigation Compose

**Rationale**: Compose is the current Android UI toolkit for Kotlin-first apps, keeps UI state testable through view models/state models, and supports concise screens for signin, guide, login, action hub, camera/history, and visible API errors.

**Alternatives considered**: XML Views were rejected as more boilerplate for new work. A WebView or cross-platform framework was rejected because the user asked for an Android mobile app that opens in Android Studio.

## Decision: Use AndroidX CameraX for capture

**Rationale**: CameraX is the standard AndroidX camera library, handles lifecycle-aware camera use, and provides a clear adapter boundary for the one-click capture flow.

**Alternatives considered**: Raw Camera2 was rejected due to complexity. External camera apps were rejected because the requirement says the camera view should be opened from the app.

## Decision: Use DataStore for session persistence

**Rationale**: The app needs to retain bearer token metadata for authenticated API calls. DataStore is the AndroidX replacement for SharedPreferences and fits simple key-value session state without introducing a local database.

**Alternatives considered**: Room was rejected because no relational local data model is required. In-memory session only was rejected because app restarts should not immediately lose an unexpired session unless implementation later chooses explicit sign-out behavior.

## Decision: Use OkHttp plus Kotlin serialization for API access

**Rationale**: The app must call JSON endpoints and multipart image upload endpoints from the existing OpenAPI contract. OkHttp is a mature Android HTTP client with straightforward multipart support; Kotlin serialization keeps DTO parsing Kotlin-first and unit-testable.

**Alternatives considered**: Retrofit was considered but adds another abstraction layer. `HttpURLConnection` was rejected because multipart upload and error-body handling would create noisy boilerplate and higher implementation risk.

## Decision: Centralize API error mapping in the Android client

**Rationale**: The constitution and spec require every API error to be visible to the user. A shared mapper from API `ErrorResponse.message` and network failures to screen state prevents silent failures and makes behavior unit-testable.

**Alternatives considered**: Per-screen ad hoc error handling was rejected because it increases the chance of inconsistent or hidden errors.

## Decision: Keep API/backend files read-only for this feature

**Rationale**: The user explicitly constrained implementation to `mobile/android` with no API code or API test changes. Planning treats `docs/openapi.yaml` as a read-only behavior reference.

**Alternatives considered**: Expanding API save/detail behavior was rejected because US6 is deferred and backend/API changes are out of scope.

## Decision: Use Maestro for five happy-path flows and unit coverage for behavior

**Rationale**: The constitution requires a happy-path Maestro flow for each Android user story and 95% Android unit coverage. Maestro covers end-to-end user journeys; unit tests cover deterministic state, validation, and error mapping.

**Alternatives considered**: Espresso-only UI tests were rejected because the constitution names Maestro. Relying only on Maestro was rejected because it would not satisfy the 95% unit coverage gate.
