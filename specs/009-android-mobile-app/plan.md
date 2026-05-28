# Implementation Plan: Android Mobile App

**Branch**: `009-android-mobile-app` | **Date**: 2026-05-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-android-mobile-app/spec.md`

**Note**: Implementation changes for this feature are constrained to `mobile/android` only. API code, API tests, backend tests, and `docs/openapi.yaml` are read-only inputs for implementation.

## Summary

Build and maintain a Kotlin Android app under `mobile/android` that can be opened in Android Studio, starts from a buildable hello world scaffold, and implements the five in-scope user stories: account creation, guide, login, capture/history choice, and saved-measurement history with date filtering. The app consumes the existing Mobile API described by `docs/openapi.yaml`, displays every API error to the user, localizes every visible string, includes a happy-path Maestro flow for US1-US5, and enforces 95% Android unit-test coverage for implemented mobile code.

This planning refresh incorporates the clarified UX requirements: password fields use Android standard password masking with brief last-character reveal; history date filters use date selector controls rather than free-text inputs; and history rows render in vertically aligned table columns for scanning.

## Technical Context

**Language/Version**: Kotlin 2.0.21 for Android code; Java/Kotlin target 17. Node.js latest active LTS is used only to run the existing API with `npm run api`.

**Android Language/Version**: Kotlin 2.0.21 pinned in `mobile/android/gradle/libs.versions.toml`. Kotlin does not publish a conventional LTS track, so this plan treats the constitution's Kotlin LTS requirement as the project-approved latest stable Android-compatible Kotlin baseline already pinned for the module.

**Primary Dependencies**: Android Gradle Plugin 8.7.3, Android platform Views/widgets, JUnit 4.13.2, JaCoCo 0.8.12, Maestro CLI, Android SDK/emulator. The implemented HTTP adapter uses Android/Java platform networking (`HttpURLConnection`) to avoid adding dependencies outside the mobile module.

**Storage**: In-memory session store for the current feature. No local database is introduced. Persisted session storage can be added later under the same session port if needed.

**Testing**: JUnit 4 unit tests for core flows, validation, API error mapping, HTTP adapter parsing/upload behavior, session store, camera gateway, and domain models; JaCoCo task `:app:androidCoverageVerify` enforces `>= 95%`; Maestro happy-path flows cover US1-US5.

**Target Platform**: Android mobile app opened, built, and run from Android Studio; local validation uses an emulator/device calling the existing API at `http://10.0.2.2:3000`, backed by `npm run api` on the host.

**Project Type**: Android mobile app plus read-only integration with existing backend API.

**Android Source Root**: `mobile/android`.

**Performance Goals**: Auth and history screens should render within 1 second after local API response; history date-selector changes should keep selected filter state visible; camera/upload starts from a single primary action on the measurement action screen.

**Constraints**: All implementation changes must stay under `mobile/android`; no API code, API tests, backend tests, or OpenAPI document changes. Every API error response message must be shown in the current screen UI, with a clear fallback for network/malformed responses. US6 detail/review/override/save remains deferred.

**API Error UX**: `ApiErrorMapper` converts API `message` values and network/timeout/parse/unexpected failures into visible screen state. Auth, upload, and history screens must preserve retry/navigation paths when displaying errors.

**Localization**: Every visible Android text value is defined in localized string resources or an equivalent localization mechanism. Kotlin code, XML resources, tests, and Maestro flows must avoid hardcoded visible user-facing text; Maestro should prefer stable resource IDs.

**Scale/Scope**: Five user stories, one Android app module, one HTTP API client boundary, one session store, one camera/upload path, and one history table screen with date selector filters. Measurement detail, image review, override, and reviewed save are out of scope.

**Maestro Coverage**: One happy-path Maestro flow each for US1, US2, US3, US4, and US5 under `mobile/android/maestro`. US5 flow must cover date filter selection/application and a visible saved measurement row; US6 has no flow because it is deferred.

**Mobile Unit Coverage**: Android unit coverage must be `>= 95%` in CI for implemented mobile code. Activity UI rendering is validated through Maestro; pure Kotlin and adapter behavior are validated with JUnit/Jacoco.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Hexagonal boundaries defined**: Mobile domain/app state depends on interfaces for auth, session storage, measurement upload, history retrieval, and camera/image capture; Android framework, HTTP, and camera implementations are adapters under `mobile/android`.
- [x] **Unit test strategy present**: Unit tests cover validation, flows, API error mapping, session behavior, HTTP auth/history/upload parsing, capture decisions, and history filter behavior.
- [x] **Coverage policy acknowledged**: Android unit coverage gate is `>= 95%`; pure Kotlin/adapters target full coverage where practical, with Activity UI covered by Maestro.
- [x] **Additive test evolution respected**: Existing API/backend tests remain unchanged; all new or changed mobile tests are under `mobile/android`.
- [x] **MCP-free implementation**: Implementation and validation use Android Studio/Gradle, repository scripts, `npm run api`, local emulator, and Maestro only.
- [x] **Feature isolation via worktree**: Feature branch is `009-android-mobile-app`; implementation should remain isolated and all generated mobile changes stay under `mobile/android`.
- [x] **Tech stack baseline**: Existing API uses latest active Node.js LTS and NestJS LTS for local validation; Android uses Kotlin 2.0.21 pinned in Gradle.
- [x] **Android source location**: Mobile app code is under `mobile/android`.
- [x] **Kotlin LTS baseline**: Kotlin 2.0.21 is treated as the project-approved latest stable Android-compatible baseline because Kotlin has no separate LTS channel.
- [x] **API errors visible to users**: Shared Android error mapping and screen state are required for every API response error and network fallback.
- [x] **Localization coverage**: Every visible Android string is required to come from localized resources or an equivalent localization mechanism.
- [x] **Maestro happy paths**: US1-US5 each have a happy-path Maestro flow.
- [x] **Android unit coverage**: Android unit tests maintain a `>= 95%` CI gate via `:app:androidCoverageVerify`.
- [x] **Dependency policy**: Backend dependencies are unchanged. Android dependencies are limited to the Gradle/Android/JUnit/Jacoco/Maestro toolchain and platform APIs.

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
`-- tasks.md              # Created by /speckit.tasks, not by /speckit.plan
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
|       |   |   `-- core/
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

**Structure Decision**: Use the standalone Android project rooted at `mobile/android`. The project owns its Gradle wrapper/configuration, app module, unit tests, Maestro flows, Android README, and CI helper script. Existing API/backend source, API tests, backend tests, and `docs/openapi.yaml` remain unchanged.

## Complexity Tracking

No constitution violations are planned. The notable tradeoffs are staying within the existing API contract, deferring US6, and using platform-native Android Views/widgets to keep dependencies minimal while satisfying localization, password masking, date-selector, and table-alignment requirements.

## Phase 0: Research

See [research.md](research.md). All previously unknown technical choices are resolved:

- Kotlin LTS interpreted as latest stable Android-compatible Kotlin pinned in Gradle.
- Native Android Views/widgets selected for the current implementation.
- Platform password masking selected for signin/login password fields.
- Date selector controls selected for history filter input.
- Vertically aligned native table/list layout selected for history rows.
- HTTP/API errors centralized through a shared mapper and visible screen state.
- API/backend files remain read-only.

## Phase 1: Design & Contracts

See [data-model.md](data-model.md), [contracts/api-client.md](contracts/api-client.md), [contracts/maestro-flows.md](contracts/maestro-flows.md), and [quickstart.md](quickstart.md).

Post-design constitution check remains passing: the design keeps mobile code under `mobile/android`, preserves ports/adapters boundaries, localizes visible strings, maps every API failure to visible UI, keeps US1-US5 Maestro happy paths, and maintains the Android `>= 95%` unit coverage gate.
