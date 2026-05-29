# Tasks: Authentication Improvement

**Input**: Design documents from `/specs/012-auth-improvement/`

**Prerequisites**: `plan.md` (required), `spec.md` (required)

**Tests**: Test tasks are REQUIRED. US1 includes Android unit tests and a Maestro happy path. US2 includes backend unit/contract tests. Preserve CI coverage gates.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared artifacts and guardrails for split-scope implementation.

- [ ] T001 Create auth improvement contracts directory at specs/012-auth-improvement/contracts/
- [ ] T002 Create API token policy contract in specs/012-auth-improvement/contracts/auth-api-policy.md
- [ ] T003 [P] Create mobile session persistence contract in specs/012-auth-improvement/contracts/mobile-session-persistence.md
- [ ] T004 [P] Update quick validation commands for both stories in specs/012-auth-improvement/quickstart.md
- [ ] T005 [P] Add feature-specific context references in specs/012-auth-improvement/plan.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared definitions and tests that both stories rely on.

**CRITICAL**: No user story implementation starts until these are complete.

- [ ] T006 Add auth-session persistence model fields for encrypted restore metadata in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/model/DomainModels.kt
- [ ] T007 Add session-store port methods for save/load/clear persisted session in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/ports/Ports.kt
- [ ] T008 Add backend config support for one-week access-token default in src/infrastructure/config/api-config.ts
- [ ] T009 [P] Add backend config validation tests for one-week access-token default in src/infrastructure/config/api-config.test.ts
- [ ] T010 [P] Add token issuance tests covering configurable TTL propagation in src/adapters/inbound/http/mobile-http-adapters.test.ts

**Checkpoint**: Shared foundations complete; stories can proceed independently.

---

## Phase 3: User Story 1 - Persist Auth Across App Shutdown (Priority: P1) 🎯 MVP

**Goal**: Keep users signed in after app restart by restoring a valid encrypted local session and routing to Camera.

**Independent Test**: Sign in once, restart app, verify user lands directly on Camera without re-entering credentials.

### Tests for User Story 1 (REQUIRED)

- [ ] T011 [P] [US1] Add unit tests for persisted-session happy path restore in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt
- [ ] T012 [P] [US1] Add unit tests for unreadable/corrupted persisted session fallback in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt
- [ ] T013 [P] [US1] Add adapter tests for encrypted persistence behavior in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/session/EncryptedSessionStoreTest.kt
- [ ] T014 [P] [US1] Add Maestro happy path for shutdown/reopen persistence in mobile/android/maestro/us1-signin.yaml
- [ ] T037 [P] [US1] Add unit tests ensuring API auth errors are surfaced as visible UI state in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt

### Implementation for User Story 1

- [ ] T015 [US1] Implement encrypted session store adapter in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/session/EncryptedSessionStore.kt
- [ ] T016 [US1] Wire encrypted session store in app composition root in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt
- [ ] T017 [US1] Persist session on successful signin/login in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt
- [ ] T018 [US1] Restore persisted session on app launch and route to Camera in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt
- [ ] T019 [US1] Show localized restore error messages in mobile/android/app/src/main/res/values/strings.xml
- [ ] T020 [P] [US1] Show localized restore error messages in mobile/android/app/src/main/res/values-es/strings.xml
- [ ] T021 [US1] Bind restore error message rendering on auth screen in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/AuthScreen.kt
- [ ] T038 [US1] Ensure login/restore API auth failures are rendered as user-visible localized messages in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt

**Checkpoint**: US1 is independently functional and testable.

---

## Phase 4: User Story 2 - Keep Token Lifetime at One Week (Priority: P2)

**Goal**: Make API-issued access tokens valid for one week for newly issued tokens only, with no Android changes.

**Independent Test**: Issue fresh token and verify seven-day expiration; verify protected endpoints reject expired tokens and accept still-valid tokens.

### Tests for User Story 2 (REQUIRED)

- [ ] T022 [P] [US2] Add use-case tests asserting seven-day TTL from signin issuance in src/application/use-cases/create-account.use-case.test.ts
- [ ] T023 [P] [US2] Add use-case tests asserting seven-day TTL from login issuance in src/application/use-cases/login-user.use-case.test.ts
- [ ] T024 [P] [US2] Add authentication tests for expired-versus-valid token acceptance boundaries in src/application/use-cases/authenticate-bearer-token.use-case.test.ts
- [ ] T025 [P] [US2] Add HTTP contract test assertions for expiresAt semantics in src/adapters/inbound/http/mobile-api.contract.test.ts
- [ ] T039 [P] [US2] Add test covering legacy pre-rollout tokens preserving prior expiry semantics in src/application/use-cases/authenticate-bearer-token.use-case.test.ts

### Implementation for User Story 2

- [ ] T026 [US2] Set ACCESS_TOKEN_TTL_SECONDS default to 604800 in src/infrastructure/config/api-config.ts
- [ ] T027 [US2] Ensure auth controller continues passing configured TTL to use cases in src/adapters/inbound/http/auth.controller.ts
- [ ] T028 [US2] Ensure login token issuance uses passed TTL consistently in src/application/use-cases/login-user.use-case.ts
- [ ] T029 [US2] Ensure account-creation token issuance uses passed TTL consistently in src/application/use-cases/create-account.use-case.ts
- [ ] T030 [US2] Document one-week access-token policy for newly issued tokens in docs/openapi.yaml

**Checkpoint**: US2 is independently functional and testable.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, regression safety, and release readiness.

- [ ] T031 [P] Run backend test suite and coverage in package.json via npm run test:coverage
- [ ] T032 [P] Run Android unit coverage verification in mobile/android/app/build.gradle.kts via :app:testDebugUnitTest and :app:androidCoverageVerify
- [ ] T033 [P] Run US1 Maestro flow in mobile/android/maestro/us1-signin.yaml
- [ ] T034 Verify US1 scope isolation (no API code/tests touched for US1) in specs/012-auth-improvement/spec.md
- [ ] T035 Verify US2 scope isolation (no Android code/tests touched for US2) in specs/012-auth-improvement/spec.md
- [ ] T036 Update implementation notes and execution evidence in specs/012-auth-improvement/quickstart.md
- [ ] T040 Add regression validation checklist for unaffected customer-journey routes in specs/012-auth-improvement/quickstart.md

---

## Constitution Check Tasks (Mandatory)

**Purpose**: Satisfy constitution requirement for explicit checks in the task list.

- [ ] T041 Verify ports/adapters boundary integrity for changed auth flows in specs/012-auth-improvement/plan.md
- [ ] T042 Verify additive test evolution (new tests added, existing tests unchanged unless justified) via git diff review in specs/012-auth-improvement/spec.md
- [ ] T043 Verify Android standards compliance (localized visible text, API error visibility, Maestro coverage, >=95% unit coverage) in specs/012-auth-improvement/spec.md
- [ ] T044 Verify worktree isolation and MCP-free execution evidence in specs/012-auth-improvement/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): no dependencies.
- Foundational (Phase 2): depends on Phase 1 and blocks all user stories.
- US1 (Phase 3): depends on Phase 2.
- US2 (Phase 4): depends on Phase 2.
- Polish (Phase 5): depends on completed stories.

### User Story Dependencies

- US1 (P1): no dependency on US2 after foundational work.
- US2 (P2): no dependency on US1 after foundational work.

### User Story Completion Order

- Preferred delivery: US1 -> US2.
- Parallel-capable delivery: US1 and US2 after Phase 2 by separate owners.

### Within Each User Story

- Tests are authored before or alongside implementation and must fail prior to code completion.
- Model/port updates precede adapter and UI/controller wiring.
- Story-specific validations must pass before moving to final polish.

## Parallel Opportunities

- Setup: T003, T004, T005
- Foundational: T009, T010
- US1 tests: T011, T012, T013, T014
- US2 tests: T022, T023, T024, T025, T039
- Polish: T031, T032, T033

## Parallel Example: User Story 1

```bash
# Run US1 tests in parallel workstreams
T011 + T012 + T013 + T014

# After store wiring is in place, localization updates can run in parallel
T019 + T020
```

## Parallel Example: User Story 2

```bash
# Implement and verify API TTL behavior in parallel
T022 + T023 + T024 + T025

# Keep code updates focused to config and issuance flow files
T026 + T028 + T029
```

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete US1 (Phase 3).
3. Validate US1 independently with unit tests + Maestro.
4. Demo restart persistence behavior.

### Incremental Delivery

1. Deliver US1 app persistence.
2. Deliver US2 API one-week access-token TTL.
3. Run cross-cutting validations and finalize docs.

### Parallel Team Strategy

1. Team A: US1 Android persistence and UI localization tasks.
2. Team B: US2 API TTL policy and backend tests.
3. Team C: verification tasks and evidence capture.

## Notes

- `[P]` means parallelizable (different files, no blocking dependency).
- `[US1]` and `[US2]` map directly to the spec user stories.
- Preserve existing behavior outside explicitly scoped changes.
- Keep additive testing and maintain coverage gates.
