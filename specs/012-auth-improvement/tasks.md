# Tasks: Auth Session Persistence Improvement

**Input**: Design documents from /specs/012-auth-improvement/

**Prerequisites**: plan.md, spec.md

**Tests**: Test tasks are REQUIRED. This feature keeps Android unit coverage >= 95% and adds happy-path Maestro flow per user story.

**Organization**: Tasks are grouped by user story for independent implementation and validation.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare Android auth-persistence scaffolding and localization/test assets.

- [ ] T001 Add auth persistence and refresh test tags in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/TestTags.kt
- [ ] T002 [P] Add localized auth restore/refresh messages in mobile/android/app/src/main/res/values/strings.xml
- [ ] T003 [P] Add localized auth restore/refresh messages in mobile/android/app/src/main/res/values-es/strings.xml
- [ ] T004 Add Maestro flow placeholders for auth persistence in mobile/android/maestro/us-auth-persist.yaml
- [ ] T005 [P] Add Maestro flow placeholders for auth refresh continuity in mobile/android/maestro/us-auth-refresh.yaml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared domain and adapter support for persisted session + token lifetime evaluation.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T006 Add token-expiry helper utilities in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/model/DomainModels.kt
- [ ] T007 Extend auth/session ports for startup restore and refresh handling in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/ports/Ports.kt
- [ ] T008 Implement persistent session storage adapter in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/session/PersistentSessionStore.kt
- [ ] T009 Integrate persistent session adapter wiring in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt
- [ ] T010 Add auth refresh request implementation in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClient.kt
- [ ] T011 Add session lifecycle flow for restore/refresh route decisions in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt
- [ ] T012 [P] Add foundational unit tests for token lifetime parsing/evaluation in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/model/DomainModelsTest.kt
- [ ] T013 [P] Add persistent session store adapter tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/session/PersistentSessionStoreTest.kt
- [ ] T014 [P] Add auth refresh API adapter tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt

**Checkpoint**: Shared auth persistence/refresh foundation is complete.

---

## Phase 3: User Story 1 - Stay Signed In After App Restart (Priority: P1) MVP

**Goal**: Restore authenticated session after app restart when token remains valid.

**Independent Test**: Sign in once, close app, reopen within validity, and confirm app bypasses auth route.

### Tests for User Story 1 (REQUIRED)

- [ ] T015 [P] [US1] Add unit tests for startup restore with valid persisted session in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt
- [ ] T016 [P] [US1] Add unit tests for missing/corrupted session routing to auth with visible message in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt
- [ ] T017 [P] [US1] Implement Maestro happy-path for restart persistence in mobile/android/maestro/us-auth-persist.yaml

### Implementation for User Story 1

- [ ] T018 [US1] Route app startup through session restore decision logic in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt
- [ ] T019 [US1] Persist session data on successful sign-in/login in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt
- [ ] T020 [US1] Restore route/auth mode state from persisted session in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt
- [ ] T021 [US1] Show localized user-visible error for unreadable/corrupted stored session in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt

**Checkpoint**: US1 is independently functional and testable.

---

## Phase 4: User Story 2 - Refresh Session Before Expiry (Priority: P2)

**Goal**: Automatically refresh session when token has <=24h remaining or expired.

**Independent Test**: Launch/resume with near-expiry token, verify refresh keeps user authenticated or shows clear recovery on failure.

### Tests for User Story 2 (REQUIRED)

- [ ] T022 [P] [US2] Add unit tests for <=24h refresh trigger and successful continuity in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt
- [ ] T023 [P] [US2] Add unit tests for refresh unauthorized failure clearing session and routing to auth in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt
- [ ] T024 [P] [US2] Add unit tests for network refresh failure showing retryable message in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt
- [ ] T025 [P] [US2] Implement Maestro happy-path for refresh continuity in mobile/android/maestro/us-auth-refresh.yaml

### Implementation for User Story 2

- [ ] T026 [US2] Add refresh decision branch for <=24h remaining token window in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt
- [ ] T027 [US2] Trigger refresh checks on app foreground resume in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt
- [ ] T028 [US2] Persist refreshed session payload and continue authenticated route in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt
- [ ] T029 [US2] Clear stale session and route to auth on unauthorized refresh in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt
- [ ] T030 [US2] Display localized retryable error for transient refresh failures in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt

**Checkpoint**: US2 is independently functional and testable.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency checks, docs, and quality gates.

- [ ] T031 [P] Update Android auth/session behavior documentation in mobile/android/README.md
- [ ] T032 Run Android unit tests and coverage gate in mobile/android/app/build.gradle.kts via :app:testDebugUnitTest and :app:androidCoverageVerify
- [ ] T033 Run Maestro auth flows in mobile/android/maestro/us-auth-persist.yaml and mobile/android/maestro/us-auth-refresh.yaml
- [ ] T034 Verify scope guard by confirming only mobile/android files changed and no API code/tests changed from /Users/max/src/github.com/masim05/blood-preasure-tracker/tmp/012-auth-improvement

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 Setup: no dependencies.
- Phase 2 Foundational: depends on Phase 1 and blocks user stories.
- Phase 3 US1: depends on Phase 2.
- Phase 4 US2: depends on Phase 2; can proceed after or alongside late US1 work if file conflicts are avoided.
- Phase 5 Polish: depends on completion of selected user stories.

### User Story Dependencies

- US1 (P1): Independent MVP after foundational work.
- US2 (P2): Depends on shared foundational refresh infrastructure but is independently testable.

### Within Each User Story

- Write tests first and confirm failing behavior before implementation.
- Preserve visible API error handling and localization in all new UI messaging.
- Ensure Maestro happy-path is updated before story sign-off.

## Parallel Opportunities

- Setup: T002, T003, T005.
- Foundational tests: T012, T013, T014.
- US1 tests: T015, T016, T017.
- US2 tests: T022, T023, T024, T025.
- Polish: T031, T034.

## Parallel Example: User Story 1

- Run T015, T016, and T017 in parallel because they target separate tests/flow assets.
- Run T019 and T021 in parallel after T018 as they touch flow and UI messaging concerns.

## Parallel Example: User Story 2

- Run T022, T023, T024, and T025 in parallel before implementation completion.
- Run T028 and T030 in parallel after T026 and T027 because they affect different layers.

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate US1 independently.
4. Ship/demo persistent restart login behavior.

### Incremental Delivery

1. Setup + foundation.
2. Deliver US1 restore flow.
3. Deliver US2 refresh continuity.
4. Run polish and quality gates.

### Parallel Team Strategy

1. Developer A: session persistence adapter + flow foundation (T006-T011).
2. Developer B: Android activity routing + localized UX updates (T018-T021, T027, T030).
3. Developer C: unit tests + Maestro flows + quality validation (T012-T017, T022-T025, T032-T033).

## Notes

- [P] tasks can run in parallel when dependencies are satisfied.
- [US1]/[US2] labels map directly to spec user stories.
- Keep all implementation in mobile/android.
- Keep API code and API tests unchanged.
- Maintain Android unit coverage >= 95%.