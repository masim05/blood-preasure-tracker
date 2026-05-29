# Implementation Plan: Android Mobile App

**Branch**: `009-android-mobile-app` | **Date**: 2026-05-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-android-mobile-app/spec.md`

**Note**: This plan is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement an Android blood-pressure tracking app under `mobile/android` using Kotlin 2.0.21 and Jetpack Compose Material 3. The app covers six user stories (US1–US6): combined auth screen, measurement guide, camera/upload screen, measurement history with date filter, and measurement detail with editable values and Save. All API errors are shown to the user; every visible string is localized; each user story has a happy-path Maestro flow; unit coverage is ≥ 95%. The API base URL is supplied per-environment through `buildConfigField` in `build.gradle.kts` — `local.properties` for local development, `ORG_GRADLE_PROJECT_apiBaseUrl` env var in CI — with `http://10.0.2.2:3000` as the debug default. No API code, API tests, or backend files change.

## Technical Context

**Language/Version**: Kotlin 2.0.21 (latest Android-compatible active LTS) on Android API 26–35

**Android Language/Version**: Kotlin 2.0.21

**Primary Dependencies**: Jetpack Compose Material 3 BOM (platform-managed versions), `androidx.activity:activity-compose`, AndroidX Foundation, AndroidX Material Icons; JUnit 4 for unit tests; Jacoco for coverage; Maestro CLI for happy-path flows

**Storage**: In-memory session storage for active bearer token; no local database required for current user stories; `buildConfigField` + `local.properties` + `ORG_GRADLE_PROJECT_apiBaseUrl` for per-environment API base URL configuration

**Testing**: `./gradlew :app:testDebugUnitTest` + `./gradlew :app:androidCoverageVerify` for unit coverage; Maestro CLI for US1–US6 happy-path flows; `npm run db:init -- --env .env.test` + `npm run api` for integration validation target

**Target Platform**: Android API 26+; emulator validation during local Maestro runs; GitHub Actions hosted runner with emulator runner action in CI

**Project Type**: Android mobile app (ports-and-adapters); source root `mobile/android`

**Android Source Root**: `mobile/android`

**Performance Goals**: Auth and navigation transitions ≤ 300 ms on emulator; upload and history list loads show user-visible loading state within 100 ms of trigger

**Constraints**: No API code, API tests, or backend files change; all visible strings localized; hard-coded API URLs prohibited in Kotlin source; 95% Android unit coverage CI gate; Maestro happy-path per user story

**API Error UX**: Every API `ErrorResponse.message` is shown on the current screen via `visibleError` state; network/malformed-response failures surface a localized fallback message; no error is swallowed silently

**Localization**: All visible strings in `res/values/strings.xml`; Spanish locale in `res/values-es/strings.xml`; no hardcoded text in Kotlin source, layouts, or Maestro flows

**Scale/Scope**: 6 user stories (US1–US6); 5 screens; 26 entity/state types; 6 Maestro flows; ≥ 95% unit coverage gate

**Maestro Coverage**: US1 (signin), US2 (guide), US3 (login), US4 (camera/upload), US5 (history filter), US6 (measurement detail); all 6 pass locally on emulator

**Mobile Unit Coverage**: ≥ 95% line coverage enforced in CI via `androidCoverageVerify` task; currently passing

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [X] **Hexagonal boundaries defined**: Domain flows depend only on `AuthGateway`, `MeasurementUploadGateway`, `HistoryGateway`, and `MeasurementDetailGateway` ports; all concrete HTTP adapters and Android platform adapters are isolated from domain logic.
- [X] **Unit test strategy present**: Every screen view model, gateway adapter, validation helper, API error mapper, and navigation decision has corresponding unit tests.
- [X] **Coverage policy acknowledged**: CI gate is `>= 95%`; `androidCoverageVerify` task enforces this in CI; currently passing.
- [X] **Additive test evolution respected**: Existing API and backend tests are not changed; only new Android unit tests and Maestro flows are added.
- [X] **MCP-free implementation**: Plan uses local Gradle tooling, Maestro CLI, and repository npm scripts only; no MCP dependency.
- [X] **Feature isolation via worktree**: Feature developed in `tmp/009-android-mobile-app` worktree; branch `009-android-mobile-app`.
- [X] **Tech stack baseline**: Backend validated against Node.js latest active LTS and NestJS latest active LTS; Android targets Kotlin 2.0.21 and API 26+.
- [X] **Android source location**: All mobile code lives under `mobile/android`.
- [X] **Kotlin LTS baseline**: Kotlin 2.0.21 (latest stable Android-compatible LTS release).
- [X] **API errors visible to users**: Every API `ErrorResponse.message` and network failure surfaces on-screen via `visibleError` state; no silent swallowing.
- [X] **Localization coverage**: All visible strings in `res/values/strings.xml` and `res/values-es/strings.xml`; no hardcoded text in Kotlin, Maestro flows, or layouts.
- [X] **Maestro happy paths**: US1–US6 each have a passing Maestro happy-path flow; all pass locally on emulator and in CI.
- [X] **Android unit coverage**: `androidCoverageVerify` gate at 95%; currently passing in CI.
- [X] **Dependency policy**: Only AndroidX/Compose official packages and JUnit 4; no unjustified third-party dependencies.

## Project Structure

### Documentation (this feature)

```text
specs/009-android-mobile-app/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output — all decisions resolved
├── data-model.md        # Phase 1 output — entities and state machines
├── quickstart.md        # Phase 1 output — local validation commands
├── contracts/
│   ├── api-client.md        # HTTP API contract consumed by Android adapters
│   └── maestro-flows.md     # Maestro flow naming and coverage contract
└── tasks.md             # Phase 2 output (/speckit.tasks command output)
```

### Source Code (repository root)

```text
mobile/android/
├── app/
│   ├── build.gradle.kts        # buildConfigField for API_BASE_URL; Jacoco coverage gate
│   └── src/
│       ├── main/
│       │   ├── java/com/masim05/bloodpressure/mobile/
│       │   │   ├── MainActivity.kt          # Compose entry point / nav host
│       │   │   ├── domain/                  # Ports: AuthGateway, HistoryGateway, etc.
│       │   │   ├── adapters/                # HTTP adapters (HttpURLConnection)
│       │   │   ├── ui/                      # Compose screens (auth, guide, camera, history, detail)
│       │   │   └── viewmodel/               # Screen ViewModels
│       │   └── res/
│       │       ├── values/strings.xml        # English localized strings
│       │       └── values-es/strings.xml     # Spanish localized strings
│       └── test/
│           └── java/com/masim05/bloodpressure/mobile/
│               └── (unit tests mirroring main package structure)
├── maestro/                    # US1–US6 happy-path Maestro flow YAML files
├── local.properties            # git-ignored; developer sets apiBaseUrl here
├── gradle.properties           # Gradle property defaults (apiBaseUrl default not stored here)
└── scripts/                    # Helper scripts for CI (e.g., run-maestro.sh)
```

**Structure Decision**: Option 3 (Mobile + API) with existing backend under `src/` unchanged and the Android app self-contained at `mobile/android`. The `buildConfigField`-based API URL wiring means no environment-specific source files need to be swapped — a single `local.properties` override or `ORG_GRADLE_PROJECT_apiBaseUrl` env var is sufficient.

## Complexity Tracking

> No constitution violations. No complexity exceptions required.

