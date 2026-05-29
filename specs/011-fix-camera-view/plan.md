# Implementation Plan: Camera Ready Capture

**Branch**: `[011-fix-camera-view]` | **Date**: 2026-05-29 | **Spec**: `/specs/011-fix-camera-view/spec.md`

**Input**: Feature specification from `/specs/011-fix-camera-view/spec.md`

## Summary

Fix the existing-user post-login camera journey so the Camera screen opens with an immediate live preview and supports one-tap capture. Preserve the existing successful upload transition to History, add explicit permission-denied recovery actions (Open Settings and History), and prevent duplicate capture attempts during upload via disabled capture + loading state. Implementation stays app-only under `mobile/android` with no API code/test changes.

## Technical Context

**Language/Version**: TypeScript 5.8.x (backend unchanged), Kotlin 2.0.21 (Android)

**Android Language/Version**: Kotlin 2.0.21 (project baseline for this feature)

**Primary Dependencies**: AndroidX Compose Material3, Activity Compose, CameraX (`PreviewView` + lifecycle camera provider integration), existing mobile networking/session flow components

**Storage**: Existing mobile session persistence (token persistence unchanged), existing backend PostgreSQL unchanged

**Testing**: Android unit tests via Gradle/JUnit, Jacoco verification task `:app:androidCoverageVerify`, Maestro flow tests under `mobile/android/maestro`

**Target Platform**: Android (minSdk 26, targetSdk 35) mobile client

**Project Type**: Mobile app + existing backend/API monorepo (feature changes restricted to mobile app)

**Android Source Root**: `mobile/android`

**Performance Goals**: Camera preview becomes visible immediately on screen entry after successful login; one-tap capture starts capture/upload flow without intermediate mode switch

**Constraints**: No API code changes; no API test changes; all user-visible strings localized; maintain CI unit coverage >=95%; work in feature worktree under `tmp/`

**API Error UX**: Upload/API failures render user-visible localized error on Camera screen; errors are not log-only

**Localization**: All visible camera flow messages and actions are sourced from Android string resources

**Scale/Scope**: Single user journey correction centered on US4 camera/history behavior and permission/error recovery

**Maestro Coverage**: Maintain/add happy-path Maestro flow for US4 (`maestro/us4-capture-or-history.yaml`) validating camera-ready -> one-tap capture -> History

**Mobile Unit Coverage**: Extend flow and camera adapter unit tests; enforce `:app:androidCoverageVerify` (>=0.95)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Hexagonal boundaries defined**: Existing domain/core flow contracts remain intact; camera UI/adapter behavior is updated without introducing framework leakage into domain logic.
- [x] **Unit test strategy present**: Add/adjust Android unit tests for permission state handling, capture disable/loading behavior, and upload success/failure routing.
- [x] **Coverage policy acknowledged**: Android unit coverage remains gated at >=95% using existing Jacoco verification.
- [x] **Additive test evolution respected**: Existing tests remain unless behavior correction requires precise expectation updates; new tests cover newly clarified behavior.
- [x] **MCP-free implementation**: Planned steps use repository-local Gradle/Maestro/tooling only.
- [x] **Feature isolation via worktree**: Active feature worktree is under `tmp/011-fix-camera-view`.
- [x] **Tech stack baseline**: Repository targets Node >=24 and NestJS 11.x in existing backend; no backend runtime changes in this feature.
- [x] **Android source location**: All implementation changes remain under `mobile/android`.
- [x] **Kotlin LTS baseline**: Android work uses repository Kotlin baseline 2.0.21.
- [x] **API errors visible to users**: API/upload failures are explicitly surfaced in camera UI state.
- [x] **Localization coverage**: User-visible camera flow text/actions are localized via resources.
- [x] **Maestro happy paths**: US4 happy-path flow is explicitly included in contracts and quickstart.
- [x] **Android unit coverage**: Coverage gate >=95% is preserved via existing Gradle task.
- [x] **Dependency policy**: Prefer official AndroidX/Compose/CameraX components; no unnecessary third-party additions planned.

## Phase 0 Research Output

Research completed in `/specs/011-fix-camera-view/research.md` with decisions on:

1. CameraX preview/capture architecture
2. Compose integration strategy using `PreviewView`
3. Error-state modeling and recovery behavior
4. Scope guard to keep changes app-only
5. Maestro + unit coverage approach

All technical-context unknowns are resolved with no open `NEEDS CLARIFICATION` items.

## Phase 1 Design Output

Design artifacts created and aligned with clarified spec:

1. `/specs/011-fix-camera-view/data-model.md`
2. `/specs/011-fix-camera-view/contracts/camera-flow-contract.md`
3. `/specs/011-fix-camera-view/contracts/maestro-us4-contract.md`
4. `/specs/011-fix-camera-view/quickstart.md`

Agent context reference is set in `.github/copilot-instructions.md` to this plan path.

## Post-Design Constitution Check

- [x] **Hexagonal boundaries remain intact**: Data model and contracts keep camera behavior in app adapters/presentation while preserving existing core flow boundaries.
- [x] **Testing and coverage remain enforceable**: Quickstart includes unit + coverage + Maestro commands.
- [x] **Android standards remain explicit**: Contracts encode API error visibility, localized UI text, and permission-denied recovery actions.
- [x] **Worktree and scope constraints preserved**: Plan continues to require `tmp/` worktree and mobile-only change boundaries.

No constitution violations or exceptions require complexity tracking.

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
└── tasks.md               # Created later by /speckit.tasks
```

### Source Code (repository root)

```text
src/                         # Existing backend/API (unchanged by this feature)
mobile/android/
├── app/
│   └── src/
│       ├── main/
│       └── test/
└── maestro/
    └── us4-capture-or-history.yaml
```

**Structure Decision**: Use the existing mobile + API repository layout; implement all behavior changes in `mobile/android` only, with backend/API code untouched.

## Complexity Tracking

No constitution gate violations identified.
