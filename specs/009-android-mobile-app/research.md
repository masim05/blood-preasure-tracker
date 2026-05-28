# Research: Android Mobile App

## Decision: Use a standalone Android project rooted at `mobile/android`

**Rationale**: The specification and constitution require all implementation changes for this feature to live under `mobile/android`. A standalone Android project lets Android Studio open, build, test, and run the app without touching existing API/backend files.

**Alternatives considered**: Placing Android code under `android/` or adding root-level Gradle files was rejected because it violates the mobile-only path constraint.

## Decision: Treat Kotlin LTS as latest stable Android-compatible Kotlin

**Rationale**: Kotlin does not publish a separate conventional LTS channel. To satisfy the constitution in an actionable way, implementation pins Kotlin 2.0.21, the project-approved stable Android-compatible Kotlin version supported by the selected Android Gradle Plugin.

**Alternatives considered**: Leaving the Kotlin version unresolved was rejected because planning must be actionable. Pinning an outdated Kotlin version was rejected because the user asked for the latest LTS/stable baseline.

## Decision: Use native Android Views/widgets for the current app UI

**Rationale**: The current mobile project is implemented with a single native `MainActivity` and platform widgets. Staying with Android Views keeps the plan aligned with the existing code, avoids dependency churn, supports localized string resources, and gives direct access to platform password fields, date picker dialogs, and aligned table/list layouts.

**Alternatives considered**: Jetpack Compose was considered during early planning but rejected for this iteration because the implemented app already uses platform Views and the user requested focused mobile-only changes. WebView or cross-platform frameworks were rejected because the app must open, build, and run as an Android Studio project.

## Decision: Use Android standard password masking behavior

**Rationale**: Android password fields conventionally reveal the most recently typed character briefly and then mask it automatically. This satisfies the clarified requirement without custom timing logic and matches user expectations for secure text entry.

**Alternatives considered**: Immediate masking was rejected because it is less usable. Custom one- or two-second reveal timers were rejected because they would duplicate platform behavior and increase test and accessibility risk.

## Decision: Use date selector controls for history filters

**Rationale**: The clarified requirement explicitly forbids free-text date filter inputs. Date selector controls reduce invalid input, localize date interaction through platform UI, and keep history filtering easier to test through stable resource IDs and date filter state.

**Alternatives considered**: Plain text `EditText` date inputs were rejected by clarification. Free-form parsing was rejected because it creates avoidable validation ambiguity.

## Decision: Render history as vertically aligned rows/columns

**Rationale**: Blood-pressure history is scanned comparatively across time, systolic, diastolic, pulse, arm side, and status. A native row layout with fixed column ordering and consistent column widths keeps values vertically aligned across rows and satisfies the clarified table requirement.

**Alternatives considered**: Concatenated row text separated by punctuation was rejected because values do not align reliably across rows. Card-per-measurement layouts were rejected because they make column comparison slower.

## Decision: Use a generated measurement image gateway for current capture validation

**Rationale**: The in-scope happy path requires one-click capture/upload behavior and API-backed upload validation. A generated PNG gateway exercises the upload pipeline without relying on emulator camera hardware, while keeping a camera gateway port in place for a future real camera adapter.

**Alternatives considered**: Raw Camera2 or CameraX integration was deferred because reliable emulator camera UX is outside the current review feedback and would add substantial dependency and permission complexity. External camera intents were rejected for the current CI path because they are hard to automate consistently with Maestro.

## Decision: Use in-memory session storage for this feature

**Rationale**: The current user stories exercise active-session behavior inside a single launched app flow. An in-memory session store keeps implementation minimal while preserving a session port that can later be backed by DataStore without changing core flows.

**Alternatives considered**: DataStore was considered for persistence but deferred because persisted sessions are not required by the current user stories. Room was rejected because no local relational data model is required.

## Decision: Use platform HTTP APIs with a centralized Android API client

**Rationale**: The current implementation uses `HttpURLConnection` behind `AuthGateway`, `MeasurementUploadGateway`, and `HistoryGateway` ports. This keeps dependencies minimal and still allows unit tests around JSON parsing, multipart upload, and API error mapping.

**Alternatives considered**: OkHttp/Retrofit were considered but rejected for this iteration because they add dependencies that are not necessary for the small existing API surface. Per-screen HTTP code was rejected because it would undermine ports/adapters boundaries.

## Decision: Centralize API error mapping in the Android client

**Rationale**: The constitution and spec require every API error to be visible to the user. A shared mapper from API `ErrorResponse.message` and network failures to screen state prevents silent failures and makes behavior unit-testable.

**Alternatives considered**: Per-screen ad hoc error handling was rejected because it increases the chance of inconsistent or hidden errors.

## Decision: Keep API/backend files read-only for this feature

**Rationale**: The user explicitly constrained implementation to `mobile/android` with no API code or API test changes. Planning treats `docs/openapi.yaml` as a read-only behavior reference.

**Alternatives considered**: Expanding API save/detail behavior was rejected because US6 is deferred and backend/API changes are out of scope.

## Decision: Use Maestro for five happy-path flows and unit coverage for behavior

**Rationale**: The constitution requires a happy-path Maestro flow for each Android user story and 95% Android unit coverage. Maestro covers end-to-end user journeys; unit tests cover deterministic state, validation, adapter parsing, and error mapping.

**Alternatives considered**: Espresso-only UI tests were rejected because the constitution names Maestro. Relying only on Maestro was rejected because it would not satisfy the 95% unit coverage gate.
