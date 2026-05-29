# Implementation Plan: Camera Ready Capture

**Branch**: `011-fix-camera-view` | **Date**: 2026-05-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/011-fix-camera-view/spec.md`

**Note**: This plan is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Replace the current placeholder camera screen (title + two buttons) with a working live camera preview that is ready immediately after existing-user login, and support one-tap capture that uploads and then navigates to History on success. Keep all changes inside `mobile/android`, preserve existing API/backend files and tests, preserve auth/session behavior, surface all camera and API errors in UI, keep localization complete, maintain Maestro happy-path coverage, and keep Android unit coverage at or above 95%.

## Technical Context

**Language/Version**: Kotlin 2.0.21, JVM target 17

**Android Language/Version**: Kotlin 2.0.21

**Primary Dependencies**: Jetpack Compose Material 3, AndroidX Activity Compose, Compose Foundation/UI; planned AndroidX CameraX modules (`camera-core`, `camera-camera2`, `camera-lifecycle`, `camera-view`) for live preview + capture; existing HTTP client adapter for upload/API calls

**Storage**: Existing in-memory `SessionStore` for auth/session continuity in current app lifecycle; no new DB/file storage required for this camera fix

**Testing**: Android unit tests (`:app:testDebugUnitTest`) plus Jacoco gate (`:app:androidCoverageVerify` >= 95%); Maestro happy-path flow updates for camera behavior

**Target Platform**: Android API 26+ (minSdk 26, targetSdk 35), emulator and device camera support

**Project Type**: Android mobile app (ports/adapters architecture)

**Android Source Root**: `mobile/android`

**Performance Goals**: Live preview visible within 1 second after entering Camera route on typical emulator/device; capture button feedback within 200 ms; upload progress/error state shown without blocking UI thread

**Constraints**: App-only change under `mobile/android`; no API code changes; no API test changes; preserve existing auth persistence behavior; all visible strings localized; keep CI coverage gate >= 95%

**API Error UX**: Upload and related API errors continue to map to user-visible `errorText` on Camera screen and never stay log-only

**Localization**: New/changed camera labels, permission guidance, and retry text must be in Android resources (`values` + localized variants), not hardcoded in Kotlin or Maestro selectors

**Scale/Scope**: One feature touch area centered on Camera route (`MainActivity`, `ui/screens/CameraScreen`, camera adapter/port, relevant tests, US4 Maestro flow)

**Maestro Coverage**: Maintain/update happy-path US4 flow (login/new account path to camera, one-tap capture, navigation to history)

**Mobile Unit Coverage**: Keep and verify `:app:androidCoverageVerify` >= 95% after camera refactor; add/adjust unit tests around camera state + capture flow

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [X] **Hexagonal boundaries defined**: Camera behavior remains behind mobile ports/adapters; UI and platform camera APIs do not leak into core flow logic.
- [X] **Unit test strategy present**: Plan includes updates for flow and adapter tests for ready/error/capture states.
- [X] **Coverage policy acknowledged**: Android CI keeps `>= 95%` gate via `androidCoverageVerify`.
- [X] **Additive test evolution respected**: Existing backend/API tests stay unchanged; camera behavior adds/updates Android-only tests.
- [X] **MCP-free implementation**: Uses local Gradle, Android tooling, and Maestro only.
- [X] **Feature isolation via worktree**: Worktree/branch is `tmp/011-fix-camera-view` and `011-fix-camera-view`.
- [X] **Tech stack baseline**: Backend baseline unchanged (Node latest active LTS, NestJS latest active LTS); mobile remains Kotlin LTS baseline.
- [X] **Android source location**: All implementation remains under `mobile/android`.
- [X] **Kotlin LTS baseline**: Kotlin stays at 2.0.21 project baseline.
- [X] **API errors visible to users**: Upload/API failures are explicitly surfaced on screen.
- [X] **Localization coverage**: Camera UI text and error messaging remain resource-backed.
- [X] **Maestro happy paths**: US4 happy path remains present and will be updated for live preview/one-tap capture semantics.
- [X] **Android unit coverage**: Plan includes running and preserving 95% coverage gate.
- [X] **Dependency policy**: Uses official AndroidX/Jetpack modules; no backend dependency churn.

## Project Structure

### Documentation (this feature)

```text
specs/011-fix-camera-view/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── camera-flow-contract.md
│   └── maestro-us4-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
mobile/android/
├── app/
│   ├── build.gradle.kts
│   └── src/
│       ├── main/kotlin/com/masim05/bloodpressure/mobile/
│       │   ├── MainActivity.kt
│       │   ├── adapters/camera/
│       │   ├── core/flow/AppFlows.kt
│       │   ├── core/ports/Ports.kt
│       │   └── ui/screens/CameraScreen.kt
│       ├── main/res/values/
│       └── test/kotlin/com/masim05/bloodpressure/mobile/
│           ├── adapters/camera/
│           └── core/flow/
└── maestro/
    └── us4-capture-or-history.yaml
```

**Structure Decision**: Keep the existing Android project layout and perform a focused refactor of camera adapter + camera screen + capture flow wiring. Backend source under `src/` remains untouched.

## Post-Design Constitution Check

- [X] **Hexagonal boundaries preserved**: Design keeps camera integration inside adapter layer and UI/controller glue.
- [X] **Tests remain additive**: New camera behavior is covered with Android-only tests and Maestro update.
- [X] **Coverage and quality gates preserved**: Plan retains `:app:androidCoverageVerify` and Maestro US4 validation in workflow.
- [X] **Scope constraints honored**: No API/backend file updates are required by design.

## Complexity Tracking

> No constitution violations or complexity exceptions are expected for this feature.
