# Implementation Plan: Android Mobile App

**Branch**: `009-android-mobile-app` | **Date**: 2026-05-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-android-mobile-app/spec.md`

**Note**: Implementation changes for this feature are constrained to `mobile/android` only. API code, API tests, backend tests, and `docs/openapi.yaml` are read-only inputs for implementation.

## Summary

Build a Kotlin Android app under `mobile/android` that can be opened in Android Studio, starts with a buildable hello world scaffold, and then implements five in-scope user stories: account creation, guide, login, capture/history choice, and saved-measurement history with date filtering. The app consumes the existing Mobile API described by `docs/openapi.yaml`, displays every API error to the user, includes a happy-path Maestro flow for US1-US5, and enforces 95% Android unit-test coverage for implemented mobile code.

## Technical Context

**Language/Version**: Kotlin latest stable Android-compatible version pinned in `mobile/android` Gradle configuration; Node.js latest active LTS is used only to run the existing API with `npm run api`.

**Android Language/Version**: Kotlin latest stable version supported by the selected Android Gradle Plugin. Kotlin does not publish a conventional LTS track, so this plan treats the constitution's Kotlin LTS requirement as the project-approved latest stable Kotlin baseline pinned during Android scaffolding.

**Primary Dependencies**: Android Gradle Plugin, AndroidX Core, Jetpack Compose, Material 3, Navigation Compose, Lifecycle/ViewModel, CameraX, DataStore, Kotlin coroutines, Kotlin serialization, OkHttp, Maestro.

**Storage**: Android DataStore for bearer session/token metadata. No local database in this feature.

**Testing**: JUnit/Kotlin unit tests for view models, validators, API error mapping, navigation decisions, session state, and history filtering; JaCoCo/Kover coverage gate at `>= 95%`; Maestro happy-path flows for US1-US5.

**Target Platform**: Android mobile app opened, built, and run from Android Studio; local validation uses the existing API at `http://localhost:3000` started separately with `npm run api`.

**Project Type**: Android mobile app plus read-only integration with existing backend API.

**Android Source Root**: `mobile/android`.

**Performance Goals**: Auth and history screens should render within 1 second after local API response; history date-filter action should update visible state immediately after response; camera launch should be a single primary action from the measurement action screen.

**Constraints**: All implementation changes must stay under `mobile/android`; no API code, API tests, backend tests, or OpenAPI document changes. Every API error response message must be shown in the current screen UI, with a clear fallback for network/malformed responses. US6 detail/review/override/save remains deferred.

**API Error UX**: A shared Android error mapper converts `ErrorResponse.message` from the API into visible screen state. Connectivity, timeout, parsing, and unexpected status failures produce user-visible fallback messages and preserve retry/navigation options.

**Scale/Scope**: Five user stories, one Android app module, one HTTP API client boundary, one session store, one camera capture/upload path, one history list screen with date filters. Measurement detail, image review, override, and reviewed save are out of scope.

**Maestro Coverage**: One happy-path Maestro flow each for US1, US2, US3, US4, and US5. The initial hello world scaffold milestone is exempt from tests only until user-story work begins.

**Mobile Unit Coverage**: Android unit coverage must be `>= 95%` in CI for implemented mobile code, with focused unit tests for UI state reducers/view models, input validation, API error mapping, session persistence abstraction, history filters, and navigation decisions.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Hexagonal boundaries defined**: Mobile domain/app state depends on interfaces for auth, session storage, measurement upload, history retrieval, camera, and clock/date formatting; Android framework, HTTP, persistence, and camera implementations are adapters under `mobile/android`.
- [x] **Unit test strategy present**: Unit tests are planned for validation, view models/state reducers, API error mapping, session behavior, capture decisions, and history filtering.
- [x] **Coverage policy acknowledged**: Android unit coverage gate is `>= 95%`; changed feature areas target 100% where practical.
- [x] **Additive test evolution respected**: Existing API/backend tests remain unchanged; all new tests are under `mobile/android`.
- [x] **MCP-free implementation**: Implementation uses Android Studio/Gradle, repository scripts, `npm run api`, and local test tools only.
- [x] **Feature isolation via worktree**: Implementation should run from `tmp/009-android-mobile-app`; the current plan is prepared on branch `009-android-mobile-app` before implementation worktree execution.
- [x] **Tech stack baseline**: Existing API uses latest active Node.js LTS and NestJS LTS for local validation; Android uses latest stable Kotlin baseline supported by the selected AGP.
- [x] **Android source location**: Mobile app code is planned under `mobile/android`.
- [x] **Kotlin LTS baseline**: Kotlin latest stable Android-compatible baseline will be pinned in `mobile/android` because Kotlin has no separate LTS channel.
- [x] **API errors visible to users**: Shared Android error mapping and screen state are required for every API response error and network fallback.
- [x] **Maestro happy paths**: US1-US5 each have a planned happy-path Maestro flow.
- [x] **Android unit coverage**: Android unit tests maintain a `>= 95%` CI gate.
- [x] **Dependency policy**: Backend dependencies are unchanged. Android dependencies are limited to standard Android/Kotlin ecosystem libraries and justified in [research.md](research.md).

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
|   `-- libs.versions.toml
|-- app/
|   |-- build.gradle.kts
|   `-- src/
|       |-- main/
|       |   |-- AndroidManifest.xml
|       |   |-- kotlin/
|       |   |   `-- com/masim05/bloodpressure/mobile/
|       |   `-- res/
|       `-- test/
|           `-- kotlin/
|-- maestro/
|   |-- us1-signin.yaml
|   |-- us2-guide.yaml
|   |-- us3-login.yaml
|   |-- us4-capture-or-history.yaml
|   `-- us5-history-filter.yaml
`-- README.md
```

**Structure Decision**: Add a standalone Android project rooted at `mobile/android`. The project owns its Gradle wrapper/configuration, app module, unit tests, Maestro flows, and Android README. Existing API/backend source, API tests, backend tests, and `docs/openapi.yaml` remain unchanged.

## Complexity Tracking

No constitution violations are planned. The notable tradeoff is using the existing API contract as-is: US6 is deferred, and any API limitation discovered during Android implementation must be handled in the Android client or deferred to a separate feature rather than changing API code/tests here.
