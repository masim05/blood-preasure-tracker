# Implementation Plan: Android Mobile App

**Branch**: `009-android-mobile-app` | **Date**: 2026-05-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-android-mobile-app/spec.md`

**Note**: Implementation changes for this feature are constrained to `mobile/android` only. API code, API tests, backend tests, and `docs/openapi.yaml` are read-only inputs for implementation.

## Summary

Update the Android app under `mobile/android` to match the clarified customer journey and official Android layout direction. The app will use Jetpack Compose Material 3 for the five-screen journey: one combined Login/New Account auth screen, guide screen, camera screen, history screen, and future measurement screen placeholder scope. In this feature, measurement detail remains deferred, so history rows remain non-clickable while the future `4 -> 5` transition is documented as out of scope. Successful New Account routes to Guide; Guide Next routes to Camera; successful Login routes to Camera; Camera History opens History; successful upload opens History. The app continues to consume the existing Mobile API described by `docs/openapi.yaml`, display every API error to users, localize visible strings, maintain happy-path Maestro flows for US1-US5, and enforce Android unit coverage `>= 95%`.

## Technical Context

**Language/Version**: Kotlin 2.0.21 for Android code; Java/Kotlin target 17. Node.js latest active LTS is used only to run the existing API with `npm run api`.

**Android Language/Version**: Kotlin 2.0.21 pinned in `mobile/android/gradle/libs.versions.toml`. Kotlin does not publish a conventional LTS track, so this plan treats the constitution's Kotlin LTS requirement as the project-approved latest stable Android-compatible Kotlin baseline already pinned for the module.

**Primary Dependencies**: Android Gradle Plugin 8.7.3, Jetpack Compose UI, Jetpack Compose Material 3, AndroidX Activity Compose, AndroidX Compose Material Icons as needed for standard controls, JUnit 4.13.2, JaCoCo 0.8.12, Maestro CLI, Android SDK/emulator. The HTTP adapter continues to use Android/Java platform networking (`HttpURLConnection`) to avoid API-client dependency churn.

**Storage**: In-memory session store for the current feature. No local database is introduced. Persisted session storage can be added later under the same session port if needed.

**Testing**: JUnit 4 unit tests for core flows, validation, API error mapping, HTTP adapter parsing/upload behavior, session store, camera gateway, and domain models; JaCoCo task `:app:androidCoverageVerify` enforces `>= 95%`; Maestro happy-path flows cover US1-US5.

**Target Platform**: Android mobile app opened, built, and run from Android Studio; local validation uses an emulator/device calling the existing API at `http://10.0.2.2:3000`, backed by `npm run api` on the host.

**Project Type**: Android mobile app plus read-only integration with existing backend API.

**Android Source Root**: `mobile/android`.

**Performance Goals**: Auth, guide, camera, and history screens should render within 1 second after local state/API response. A returning user should reach the camera screen within 2 minutes during local validation. Date filtering should require no more than 3 user actions after reaching history.

**Constraints**: All implementation changes must stay under `mobile/android`; no API code, API tests, backend tests, or OpenAPI document changes. Every API error response message must be shown in the current screen UI, with a clear fallback for network/malformed responses. US6 measurement detail/review/override/save remains deferred.

**API Error UX**: `ApiErrorMapper` converts API `message` values and network/timeout/parse/unexpected failures into visible Compose screen state. Auth, upload, and history screens preserve retry/navigation paths when displaying errors.

**Localization**: Every visible Android text value is defined in localized string resources or an equivalent localization mechanism used by Compose. Kotlin code, XML resources, tests, and Maestro flows avoid hardcoded visible user-facing text; Maestro prefers stable resource IDs/content descriptions.

**Scale/Scope**: Five in-scope user stories, one Android app module, one HTTP API client boundary, one session store, one camera/upload path, one combined auth screen, one guide screen, one camera screen, and one history table screen with date selector filters. Measurement detail, image review, override, and reviewed save are out of scope.

**Maestro Coverage**: One happy-path Maestro flow each for US1, US2, US3, US4, and US5 under `mobile/android/maestro`. Flows must be updated for the combined auth screen, camera-first destination, and Compose-accessible selectors. US6 has no flow because it is deferred.

**Mobile Unit Coverage**: Android unit coverage must be `>= 95%` in CI for implemented mobile code. Compose UI rendering is validated through Maestro; pure Kotlin and adapter behavior are validated with JUnit/Jacoco.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Hexagonal boundaries defined**: Mobile domain/app state depends on interfaces for auth, session storage, measurement upload, history retrieval, and camera/image capture; Compose UI, HTTP, and camera implementations are adapters under `mobile/android`.
- [x] **Unit test strategy present**: Unit tests cover validation, flows, API error mapping, session behavior, HTTP auth/history/upload parsing, capture decisions, and history filter behavior.
- [x] **Coverage policy acknowledged**: Android unit coverage gate is `>= 95%`; pure Kotlin/adapters target full coverage where practical, with Compose UI covered by Maestro.
- [x] **Additive test evolution respected**: Existing API/backend tests remain unchanged; all new or changed mobile tests are under `mobile/android`.
- [x] **MCP-free implementation**: Implementation and validation use Android Studio/Gradle, repository scripts, `npm run api`, local emulator, and Maestro only.
- [x] **Feature isolation via worktree**: Feature branch is `009-android-mobile-app`; implementation work must be performed from `tmp/009-android-mobile-app` or explicitly waived by maintainers before coding resumes.
- [x] **Tech stack baseline**: Existing API uses latest active Node.js LTS and NestJS LTS for local validation; Android uses Kotlin 2.0.21 pinned in Gradle.
- [x] **Android source location**: Mobile app code is under `mobile/android`.
- [x] **Kotlin LTS baseline**: Kotlin 2.0.21 is treated as the project-approved latest stable Android-compatible baseline because Kotlin has no separate LTS channel.
- [x] **API errors visible to users**: Shared Android error mapping and Compose screen state are required for every API response error and network fallback.
- [x] **Localization coverage**: Every visible Android string is required to come from localized resources or an equivalent localization mechanism.
- [x] **Maestro happy paths**: US1-US5 each have a happy-path Maestro flow.
- [x] **Android unit coverage**: Android unit tests maintain a `>= 95%` CI gate via `:app:androidCoverageVerify`.
- [x] **Dependency policy**: Backend dependencies are unchanged. Android dependency additions are limited to official AndroidX/Jetpack Compose Material 3 UI dependencies required by the clarified layout approach.

## Project Structure

### Documentation (this feature)

```text
specs/009-android-mobile-app/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- api-client.md
|   `-- maestro-flows.md
`-- tasks.md              # Created/updated by /speckit.tasks, not by /speckit.plan
```

### Source Code (repository root)

```text
mobile/android/
|-- settings.gradle.kts
|-- build.gradle.kts
|-- gradle/
|   |-- libs.versions.toml
|   `-- wrapper/
|-- app/
|   |-- build.gradle.kts
|   `-- src/
|       |-- main/
|       |   |-- AndroidManifest.xml
|       |   |-- kotlin/com/masim05/bloodpressure/mobile/
|       |   |   |-- MainActivity.kt
|       |   |   |-- adapters/
|       |   |   |-- core/
|       |   |   `-- ui/              # Compose screens/state adapters
|       |   `-- res/values/
|       `-- test/kotlin/com/masim05/bloodpressure/mobile/
|-- maestro/
|   |-- us1-signin.yaml
|   |-- us2-guide.yaml
|   |-- us3-login.yaml
|   |-- us4-capture-or-history.yaml
|   `-- us5-history-filter.yaml
|-- scripts/
|   `-- ci.sh
`-- README.md
```

**Structure Decision**: Use the standalone Android project rooted at `mobile/android`. The project owns its Gradle wrapper/configuration, app module, Compose UI, unit tests, Maestro flows, Android README, and CI helper script. Existing API/backend source, API tests, backend tests, and `docs/openapi.yaml` remain unchanged.

## Complexity Tracking

No constitution violations are planned. The notable tradeoffs are adding official AndroidX Compose Material 3 dependencies to satisfy the clarified layout approach, staying within the existing API contract, deferring US6, and preserving ports/adapters boundaries while moving UI from imperative Android Views to Compose.

## Phase 0: Research

See [research.md](research.md). All technical choices are resolved:

- Kotlin LTS interpreted as latest stable Android-compatible Kotlin pinned in Gradle.
- Jetpack Compose Material 3 selected for official-guide screen layouts.
- Combined auth screen selected with Login/New Account modes or tabs.
- Camera screen selected as the post-guide/post-login destination.
- Measurement detail transition remains future scope.
- Platform password masking selected for auth password fields.
- Date selector controls selected for history filter input.
- Vertically aligned Compose table/list layout selected for history rows.
- HTTP/API errors centralized through a shared mapper and visible screen state.
- API/backend files remain read-only.

## Phase 1: Design & Contracts

See [data-model.md](data-model.md), [contracts/api-client.md](contracts/api-client.md), [contracts/maestro-flows.md](contracts/maestro-flows.md), and [quickstart.md](quickstart.md).

Post-design constitution check remains passing: the design keeps mobile code under `mobile/android`, preserves ports/adapters boundaries, localizes visible strings, maps every API failure to visible UI, keeps US1-US5 Maestro happy paths, maintains the Android `>= 95%` unit coverage gate, and limits dependency changes to official AndroidX Compose Material 3 UI dependencies required by the clarified layout approach.
