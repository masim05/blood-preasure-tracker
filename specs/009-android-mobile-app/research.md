# Research: Android Mobile App

## Decision: Use a standalone Android project rooted at `mobile/android`

**Rationale**: The specification and constitution require all implementation changes for this feature to live under `mobile/android`. A standalone Android project lets Android Studio open, build, test, and run the app without touching existing API/backend files.

**Alternatives considered**: Placing Android code under `android/` or adding root-level Gradle files was rejected because it violates the mobile-only path constraint.

## Decision: Treat Kotlin LTS as latest stable Android-compatible Kotlin

**Rationale**: Kotlin does not publish a separate conventional LTS channel. To satisfy the constitution in an actionable way, implementation pins Kotlin 2.0.21, the project-approved stable Android-compatible Kotlin version supported by the selected Android Gradle Plugin.

**Alternatives considered**: Leaving the Kotlin version unresolved was rejected because planning must be actionable. Pinning an outdated Kotlin version was rejected because the user asked for the latest LTS/stable baseline.

## Decision: Migrate screens to Jetpack Compose Material 3

**Rationale**: The clarification selects Jetpack Compose Material 3 and asks for layouts suggested by official Android guidance. Compose Material 3 provides official Android UI primitives for forms, buttons, date picker state, lists/tables, top-level screen structure, and accessible semantics while keeping UI code inside `mobile/android`.

**Alternatives considered**: Continuing native imperative Views was rejected because the user selected Compose Material 3. Material Components XML Views were rejected because they do not satisfy the selected Compose migration direction.

## Decision: Use one auth screen with Login and New Account modes/tabs

**Rationale**: The clarified journey names one login/new-account screen. A single Compose auth screen with distinct modes keeps screen count aligned with the journey while preserving different success routes: New Account routes to Guide, Login routes to Camera.

**Alternatives considered**: Separate login and signin screens were rejected because they contradict the single screen numbering. Showing both full forms at once was rejected because it is noisier and less consistent with official form guidance.

## Decision: Use camera screen as the authenticated post-guide and post-login destination

**Rationale**: The clarified transitions route Guide Next and successful Login directly to screen 3, the camera view. The camera screen owns capture/upload and includes a History button. Successful upload opens History.

**Alternatives considered**: Keeping a separate action hub was rejected because it introduces an extra screen not present in the clarified journey. Adding both action hub and camera screen was rejected because it would create six screens.

## Decision: Implement measurement detail navigation from history

**Rationale**: The clarified customer journey requires `4 -> 5` by tapping a measurement line and `5 -> 4` by tapping Back. Implementing the detail route in Android completes that journey while keeping API/backend files read-only.

**Alternatives considered**: Leaving rows without detail navigation was rejected because it violates the clarified journey. Changing backend behavior was rejected because API/backend files remain out of scope.

## Decision: Use Android standard password masking behavior

**Rationale**: Android password fields conventionally reveal newly typed characters briefly and then mask them automatically. The Compose auth screen mirrors that behavior with a short reveal timer and password keyboard options.

**Alternatives considered**: Immediate masking was rejected because it is less usable. A permanent show/hide password toggle was rejected because the requirement asks for automatic hiding after typing.

## Decision: Use Material 3 date selector controls for history filters

**Rationale**: The clarified requirement explicitly forbids free-text date filter inputs. Compose Material 3 date picker controls reduce invalid input, support localized presentation, and keep history filtering testable through stable semantics/content descriptions.

**Alternatives considered**: Plain text date fields and free-form parsing were rejected because they create avoidable validation ambiguity.

## Decision: Render history as vertically aligned Compose rows/columns

**Rationale**: Blood-pressure history is scanned comparatively across time, systolic, diastolic, pulse, arm side, and status. A Compose row layout with fixed column order and weights keeps values vertically aligned across rows and satisfies the clarified table requirement.

**Alternatives considered**: Concatenated row text separated by punctuation was rejected because values do not align reliably across rows. Card-per-measurement layouts were rejected because they make column comparison slower.

## Decision: Use a generated measurement image gateway for current capture validation

**Rationale**: The in-scope happy path requires one-click capture/upload behavior and API-backed upload validation. A generated PNG gateway exercises the upload pipeline without relying on emulator camera hardware, while keeping a camera gateway port in place for a future real camera adapter.

**Alternatives considered**: Raw Camera2 or CameraX integration was deferred because reliable emulator camera UX is outside the current clarified implementation scope and would add substantial dependency and permission complexity. External camera intents were rejected for the current CI path because they are hard to automate consistently with Maestro.

## Decision: Use in-memory session storage for this feature

**Rationale**: The current user stories exercise active-session behavior inside a single launched app flow. An in-memory session store keeps implementation minimal while preserving a session port that can later be backed by DataStore without changing core flows.

**Alternatives considered**: DataStore was considered for persistence but deferred because persisted sessions are not required by the current user stories. Room was rejected because no local relational data model is required.

## Decision: Use platform HTTP APIs with a centralized Android API client

**Rationale**: The current implementation uses `HttpURLConnection` behind `AuthGateway`, `MeasurementUploadGateway`, and `HistoryGateway` ports. This keeps API-client dependencies minimal and still allows unit tests around JSON parsing, multipart upload, and API error mapping.

**Alternatives considered**: OkHttp/Retrofit were considered but rejected for this iteration because they add dependencies that are not necessary for the small existing API surface. Per-screen HTTP code was rejected because it would undermine ports/adapters boundaries.

## Decision: Centralize API error mapping in the Android client

**Rationale**: The constitution and spec require every API error to be visible to the user. A shared mapper from API `ErrorResponse.message` and network failures to screen state prevents silent failures and makes behavior unit-testable.

**Alternatives considered**: Per-screen ad hoc error handling was rejected because it increases the chance of inconsistent or hidden errors.

## Decision: Keep API/backend files read-only for this feature

**Rationale**: The user explicitly constrained implementation to `mobile/android` with no API code or API test changes. Planning treats `docs/openapi.yaml` as a read-only behavior reference.

**Alternatives considered**: Expanding backend save/detail behavior was rejected because backend/API changes are out of scope.

## Decision: Use Maestro for six happy-path flows and unit coverage for behavior

**Rationale**: The constitution requires a happy-path Maestro flow for each Android user story and 95% Android unit coverage. Maestro covers end-to-end user journeys; unit tests cover deterministic state, validation, adapter parsing, and error mapping.

**Alternatives considered**: Espresso-only UI tests were rejected because the constitution names Maestro. Relying only on Maestro was rejected because it would not satisfy the 95% unit coverage gate.

## Decision: Supply API base URL per-environment via `buildConfigField` in `build.gradle.kts`

**Rationale**: Android does not have a runtime `.env` file mechanism. The idiomatic approach is to inject environment-specific values at compile time through `buildConfigField`. The value is read from a Gradle property (`apiBaseUrl`) using `providers.gradleProperty()`, which resolves from three sources in priority order: (1) `local.properties` for local developer overrides (git-ignored, analogous to `.env`), (2) the `ORG_GRADLE_PROJECT_apiBaseUrl` environment variable for CI injection, (3) the hardcoded `orElse("http://10.0.2.2:3000")` default for Android emulator debug builds. The resulting `BuildConfig.API_BASE_URL` constant is consumed by the HTTP adapter. Hard-coded base URLs in Kotlin source are prohibited by FR-029.

**Alternatives considered**: Runtime `assets/config.json` swapped per flavor was rejected because it adds runtime file-read boilerplate without benefit for a small API surface. A shared `gradle.properties` default was rejected because it would commit the URL to version control and require manual override per developer. Hard-coding `10.0.2.2:3000` directly in Kotlin was rejected because it blocks CI and release use without a code change.
