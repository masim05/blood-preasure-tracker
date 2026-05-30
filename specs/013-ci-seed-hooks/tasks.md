# Tasks: CI Seed Hooks

**Input**: Design documents from `/specs/013-ci-seed-hooks/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Test tasks are required for each user story in this feature. Existing API behavior tests remain unchanged; new validation is added through bootstrap-focused and workflow-contract Jest tests.

**Organization**: Tasks are grouped by user story so each story can be implemented and verified independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the task scaffolding and feature-specific bootstrap test surface.

- [X] T001 Create Android bootstrap test directory and file scaffold in tests/bootstrap/android-ci-bootstrap.test.ts
- [X] T002 Confirm Android CI seed migration scope and ordering expectations from specs/013-ci-seed-hooks/contracts/ci-workflow-order.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build reusable fixture-seeding support that all user stories depend on.

**CRITICAL**: No user story work starts until these tasks are complete.

- [X] T003 Create deterministic Maestro fixture constants and IDs in src/test-support/android-maestro-fixtures.ts
- [X] T004 Implement shared seed executor with PostgreSQL client lifecycle in src/test-support/android-maestro-fixtures.ts
- [X] T005 Implement password hash helper and fixture timestamp strategy in src/test-support/android-maestro-fixtures.ts
- [X] T006 Add bootstrap environment loading utility for `.env.test` in tests/bootstrap/android-ci-bootstrap.test.ts

**Checkpoint**: Shared bootstrap primitives are ready for story implementation.

---

## Phase 3: User Story 1 - Remove Inline CI Seeds (Priority: P1) MVP

**Goal**: Replace inline Android CI seed payloads with the shared Jest bootstrap path.

**Independent Test**: Run Android bootstrap Jest target once against a clean test DB and verify required fixtures exist; verify `.github/workflows/ci.yml` no longer embeds inline seed payloads.

### Tests for User Story 1

- [X] T007 [P] [US1] Add bootstrap test that seeds required users and saved measurement in tests/bootstrap/android-ci-bootstrap.test.ts
- [X] T008 [P] [US1] Add contract assertion that inline Maestro seed heredoc signatures are absent in src/test-workflow.contract.test.ts

### Implementation for User Story 1

- [X] T009 [US1] Replace inline `Seed Maestro accounts` payload with bootstrap Jest invocation in .github/workflows/ci.yml
- [X] T010 [US1] Ensure Android CI step order runs bootstrap after db:init and before Gradle/Maestro in .github/workflows/ci.yml
- [X] T011 [US1] Implement Jest `before` bootstrap invocation using shared seed executor in tests/bootstrap/android-ci-bootstrap.test.ts

**Checkpoint**: Inline CI seeding is removed and replaced by Jest bootstrap.

---

## Phase 4: User Story 2 - Keep Seed Setup Reusable and Safe (Priority: P2)

**Goal**: Ensure bootstrap seeding is idempotent, isolated to test paths, and fails fast on setup issues.

**Independent Test**: Run bootstrap target twice and confirm both runs succeed with stable fixture state; simulate setup failure and confirm bootstrap exits before downstream Android steps.

### Tests for User Story 2

- [X] T012 [P] [US2] Add idempotency test that runs seed executor twice in tests/bootstrap/android-ci-bootstrap.test.ts
- [X] T013 [P] [US2] Add fail-fast test for missing or invalid DATABASE_URL in tests/bootstrap/android-ci-bootstrap.test.ts

### Implementation for User Story 2

- [X] T014 [US2] Implement UPSERT semantics for user fixtures keyed by email in src/test-support/android-maestro-fixtures.ts
- [X] T015 [US2] Implement UPSERT semantics for saved measurement fixture keyed by id in src/test-support/android-maestro-fixtures.ts
- [X] T016 [US2] Add explicit error propagation and client cleanup guarantees in src/test-support/android-maestro-fixtures.ts

**Checkpoint**: Bootstrap is repeatable, safe, and isolated to test bootstrap code.

---

## Phase 5: User Story 3 - Preserve CI Gate Visibility (Priority: P3)

**Goal**: Enforce migration and ordering through automated contract validation.

**Independent Test**: Run workflow contract tests and confirm they fail if bootstrap step is removed/misordered or if inline seed payloads are reintroduced.

### Tests for User Story 3

- [X] T017 [P] [US3] Add contract assertion that bootstrap step exists between db:init and Android Gradle step in src/test-workflow.contract.test.ts
- [X] T018 [P] [US3] Add contract assertion that non-Android jobs do not invoke Android bootstrap in src/test-workflow.contract.test.ts
- [X] T019 [P] [US3] Add contract assertion that inline Node/SQL seed payload markers are absent in src/test-workflow.contract.test.ts

### Implementation for User Story 3

- [X] T020 [US3] Refactor workflow parsing helpers for ordered-step assertions in src/test-workflow.contract.test.ts
- [X] T021 [US3] Align bootstrap fixture expectations with contract fixture IDs/emails in tests/bootstrap/android-ci-bootstrap.test.ts

**Checkpoint**: CI migration is guarded by contract tests and bootstrap checks.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation of the completed migration.

- [X] T022 [P] Update bootstrap execution and idempotency commands in specs/013-ci-seed-hooks/quickstart.md
- [X] T023 [P] Update CI ordering contract notes to match final workflow step names in specs/013-ci-seed-hooks/contracts/ci-workflow-order.md
- [X] T024 Run bootstrap and contract test paths via npm run test:coverage and document verification notes in specs/013-ci-seed-hooks/quickstart.md
- [X] T025 Enforce scope guard by verifying changed files are limited to .github/workflows/ci.yml, src/test-support/, tests/bootstrap/, src/test-workflow.contract.test.ts, jest.config.ts, and specs/013-ci-seed-hooks/
- [X] T026 Verify FR-010 baseline remains unchanged by confirming Node.js 24.x and NestJS 11.x repository targets in package.json and plan constraints
- [X] T027 Verify FR-011 dependency policy by confirming no new third-party dependencies were added, or document explicit justification in specs/013-ci-seed-hooks/plan.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): starts immediately.
- Foundational (Phase 2): depends on Setup; blocks all user stories.
- User Story phases (Phases 3-5): all depend on Foundational completion.
- Polish (Phase 6): depends on completion of all targeted user stories.

### User Story Dependencies

- US1 (P1): starts after Foundational; defines the bootstrap migration baseline.
- US2 (P2): starts after US1 migration is in place; hardens idempotency and failure handling.
- US3 (P3): starts after US1 migration is visible in workflow; adds regression guardrails.

### Within Each User Story

- Write tests first and confirm they fail before implementation.
- Complete implementation tasks to satisfy each story's independent test.
- Keep implementation modifications limited to .github/workflows/ci.yml and test bootstrap support files, with documentation updates allowed under specs/013-ci-seed-hooks.

## Parallel Opportunities

- Setup: T001 and T002 can run in parallel.
- Foundational: T003, T005, and T006 can run in parallel after T004 is scoped.
- US1: T007 and T008 can run in parallel.
- US2: T012 and T013 can run in parallel.
- US3: T017, T018, and T019 can run in parallel.
- Polish: T022 and T023 can run in parallel.

## Parallel Example: User Story 1

```bash
# Run US1 tests in parallel workstreams:
Task T007 in tests/bootstrap/android-ci-bootstrap.test.ts
Task T008 in src/test-workflow.contract.test.ts
```

## Parallel Example: User Story 2

```bash
# Run US2 validation tasks in parallel workstreams:
Task T012 in tests/bootstrap/android-ci-bootstrap.test.ts
Task T013 in tests/bootstrap/android-ci-bootstrap.test.ts
```

## Parallel Example: User Story 3

```bash
# Run US3 contract assertions in parallel workstreams:
Task T017 in src/test-workflow.contract.test.ts
Task T018 in src/test-workflow.contract.test.ts
Task T019 in src/test-workflow.contract.test.ts
```

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1) and validate independently.
3. Stop for review/merge if only migration baseline is needed.

### Incremental Delivery

1. Deliver US1 migration (inline seed removal + bootstrap invocation).
2. Deliver US2 reliability hardening (idempotency + fail-fast behavior).
3. Deliver US3 regression enforcement (workflow contract guardrails).
4. Finish with polish/documentation and full coverage validation.

### Team Parallel Strategy

1. One engineer handles bootstrap support (Phase 2, US2).
2. One engineer handles CI workflow migration (US1).
3. One engineer handles contract guardrails (US3).
4. Merge after shared fixture contract is stable.

## Notes

- [P] indicates tasks that can run in parallel on different files without blocked dependencies.
- [US1]/[US2]/[US3] labels map each task to the corresponding user story.
- Every task includes an explicit file path and is ready for direct execution.
