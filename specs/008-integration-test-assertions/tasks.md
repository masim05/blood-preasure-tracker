# Tasks: Integration Test Assertions

**Input**: Design documents from `/specs/008-integration-test-assertions/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/mobile-api-integration-output.md](contracts/mobile-api-integration-output.md), [quickstart.md](quickstart.md)

**Tests**: No separate test files are generated. This maintenance change is itself a restructuring of `tests/integration/mobile-api.integration.test.ts`, and validation is the existing mobile API integration suite plus lint.

**Organization**: Tasks are grouped by user story so response readability, persistence readability, and scoped review can each be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel only when it touches a different file or depends on completed prior work
- **[Story]**: Maps to the user story from [spec.md](spec.md)
- Every task includes exact file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the target scope and current suite inventory before editing.

- [ ] T001 Review feature constraints in specs/008-integration-test-assertions/spec.md and specs/008-integration-test-assertions/plan.md
- [ ] T002 Inventory all endpoint-level `describe` blocks and existing `it` assertions inside `mobile API integration flow` in tests/integration/mobile-api.integration.test.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the safe editing pattern that all assertion-splitting work must follow.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 Define the per-example scenario setup approach for repeated signin, login, measurement upload, recognition, image, save, history, and logging flows in tests/integration/mobile-api.integration.test.ts
- [ ] T004 Confirm no production source files or test files outside tests/integration/mobile-api.integration.test.ts need edits for this feature in specs/008-integration-test-assertions/quickstart.md
- [ ] T005 Confirm dedicated worktree isolation is waived and current-checkout implementation is allowed in specs/008-integration-test-assertions/quickstart.md

**Checkpoint**: The implementation path is constrained to isolated examples inside the existing mobile API integration suite.

---

## Phase 3: User Story 1 - Readable Response Assertions (Priority: P1) MVP

**Goal**: Every existing endpoint-level scenario exposes the primary HTTP status and response format as separately named examples while preserving `describe` names.

**Independent Test**: Run `npm run test:integration -- --runTestsByPath tests/integration/mobile-api.integration.test.ts --verbose` and confirm every endpoint-level scenario under `mobile API integration flow` shows `responds with HTTP <code>` plus `responds with proper json` or a binary image format example as applicable.

### Implementation for User Story 1

- [ ] T006 [US1] Split the `POST /api/v1/signin` response status and JSON body assertions into focused examples in tests/integration/mobile-api.integration.test.ts
- [ ] T007 [US1] Split the `POST /api/v1/login` response status and JSON body assertions into focused examples in tests/integration/mobile-api.integration.test.ts
- [ ] T008 [US1] Split the `GET /api/v1/measurements` response status and JSON body assertions for empty history, invalid token, invalid range, saved history, and debug logging scenarios in tests/integration/mobile-api.integration.test.ts
- [ ] T009 [US1] Split the `POST /api/v1/measurements` response status and JSON body assertions for happy path, missing image, and missing bearer token scenarios in tests/integration/mobile-api.integration.test.ts
- [ ] T010 [US1] Split the `GET /api/v1/measurements/{id}` response status and JSON body assertions for recognized, missing bearer token, and not found scenarios in tests/integration/mobile-api.integration.test.ts
- [ ] T011 [US1] Split the `GET /api/v1/measurements/{id}/image` response status and binary image format assertions for happy path, missing bearer token, and not found scenarios in tests/integration/mobile-api.integration.test.ts
- [ ] T012 [US1] Split the `POST /api/v1/measurements/{id}/save` response status and JSON body assertions for happy path, missing bearer token, not found, and pending conflict scenarios in tests/integration/mobile-api.integration.test.ts
- [ ] T013 [US1] Verify every existing endpoint-level `describe` name remains unchanged after response assertion splitting in tests/integration/mobile-api.integration.test.ts
- [ ] T014 [US1] Run verbose mobile API integration output validation for response assertion names using tests/integration/mobile-api.integration.test.ts

**Checkpoint**: User Story 1 is complete when response status and response format failures are identifiable from Jest example names for all endpoint-level scenarios.

---

## Phase 4: User Story 2 - Readable Persistence Assertions (Priority: P2)

**Goal**: Existing database, filesystem, OpenAI-boundary, and logging side-effect checks are separately named from HTTP response checks.

**Independent Test**: Run the verbose mobile API integration suite and confirm scenarios with side effects show separate persistence, filesystem, OpenAI-boundary, or logging example names without inventing side-effect checks for response-only scenarios.

### Implementation for User Story 2

- [ ] T015 [US2] Split `POST /api/v1/signin - happy path` user account and bearer token PostgreSQL assertions into separate examples in tests/integration/mobile-api.integration.test.ts
- [ ] T016 [US2] Split `POST /api/v1/login - happy path` bearer token PostgreSQL assertion into a separate example in tests/integration/mobile-api.integration.test.ts
- [ ] T017 [US2] Split `GET /api/v1/measurements - happy path empty history` PostgreSQL empty-history assertion into a separate example in tests/integration/mobile-api.integration.test.ts
- [ ] T018 [US2] Split `POST /api/v1/measurements - happy path` measurement, image, recognition task, pending status, and OpenAI-not-called assertions into separate examples in tests/integration/mobile-api.integration.test.ts
- [ ] T019 [US2] Split `GET /api/v1/measurements/{id} - happy path recognized measurement` OpenAI-call assertion into a separate example in tests/integration/mobile-api.integration.test.ts
- [ ] T020 [US2] Split `GET /api/v1/measurements/{id}/image - happy path` filesystem-backed image byte assertion into a separate example in tests/integration/mobile-api.integration.test.ts
- [ ] T021 [US2] Split `POST /api/v1/measurements/{id}/save - happy path` saved-status PostgreSQL assertion into a separate example in tests/integration/mobile-api.integration.test.ts
- [ ] T022 [US2] Split `GET /api/v1/measurements - happy path saved history` no-image-bytes response-side assertion into a separately named example in tests/integration/mobile-api.integration.test.ts
- [ ] T023 [US2] Split `GET /api/v1/measurements - debug logging` request log status and redaction assertions into separate examples in tests/integration/mobile-api.integration.test.ts
- [ ] T024 [US2] Verify response-only negative scenarios do not add unrelated persistence assertions in tests/integration/mobile-api.integration.test.ts
- [ ] T025 [US2] Run verbose mobile API integration output validation for persistence and side-effect assertion names using tests/integration/mobile-api.integration.test.ts

**Checkpoint**: User Story 2 is complete when infrastructure side-effect failures are identifiable separately from response contract failures.

---

## Phase 5: User Story 3 - Scoped Test-Only Change (Priority: P3)

**Goal**: The final diff remains limited to assertion organization in the mobile API integration suite and preserves current repository behavior.

**Independent Test**: Inspect the final diff and run validation commands from [quickstart.md](quickstart.md) to confirm only the allowed integration test file changes during implementation.

### Implementation for User Story 3

- [ ] T026 [US3] Inspect the implementation diff and confirm no production files under src/ changed for this maintenance change in specs/008-integration-test-assertions/quickstart.md
- [ ] T027 [US3] Inspect the implementation diff and confirm no new test files or existing test files outside tests/integration/mobile-api.integration.test.ts changed for this maintenance change in specs/008-integration-test-assertions/quickstart.md
- [ ] T028 [US3] Run `npm run db:init -- --env .env.test` before integration validation for tests/integration/mobile-api.integration.test.ts
- [ ] T029 [US3] Run `npm run test:integration -- --runTestsByPath tests/integration/mobile-api.integration.test.ts --verbose` and verify all split assertions pass in tests/integration/mobile-api.integration.test.ts
- [ ] T030 [US3] Run `npm run lint` and resolve lint issues only in tests/integration/mobile-api.integration.test.ts if any are introduced

**Checkpoint**: User Story 3 is complete when validation passes and the diff is scoped to the requested test-only restructuring.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency checks across all stories.

- [ ] T031 Confirm all tasks and generated artifacts remain consistent with specs/008-integration-test-assertions/contracts/mobile-api-integration-output.md
- [ ] T032 Confirm `git diff --stat` shows only allowed implementation files plus Spec Kit artifacts for specs/008-integration-test-assertions/tasks.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user story implementation.
- **User Story 1 (Phase 3)**: Depends on Foundational; MVP scope.
- **User Story 2 (Phase 4)**: Depends on Foundational and benefits from the response setup pattern established by User Story 1.
- **User Story 3 (Phase 5)**: Depends on implementation stories being complete enough to inspect and validate.
- **Polish (Phase 6)**: Depends on selected user stories being complete.

### User Story Dependencies

- **US1 Readable Response Assertions**: Can start after Phase 2; no dependency on US2.
- **US2 Readable Persistence Assertions**: Can start after Phase 2, but should reuse the helper style established while completing US1.
- **US3 Scoped Test-Only Change**: Runs after US1 and US2 implementation changes are available.

### Within Each User Story

- Keep endpoint-level `describe` titles unchanged before modifying `it` examples.
- Create or reuse scenario-local setup helpers before splitting assertions that need repeated setup.
- Split response status before response format for each scenario.
- Split side-effect assertions after the scenario's primary response assertions are clear.
- Validate the story independently before moving to lower-priority work.

### Parallel Opportunities

- T001 and T002 can be performed by different reviewers, but both inspect planning and test files.
- US1 endpoint groups T005 through T011 can be divided by endpoint family if contributors coordinate edits to tests/integration/mobile-api.integration.test.ts.
- US2 side-effect groups T014 through T022 can be divided by endpoint family after the response split pattern is established.
- Validation tasks T028, T029, and T030 must run sequentially because database initialization precedes integration tests and lint should inspect the final code.

---

## Parallel Example: User Story 1

```bash
# Coordinate endpoint-family edits in tests/integration/mobile-api.integration.test.ts:
Task: "T006 [US1] Split the POST /api/v1/signin response status and JSON body assertions"
Task: "T007 [US1] Split the POST /api/v1/login response status and JSON body assertions"
Task: "T011 [US1] Split the GET /api/v1/measurements/{id}/image response status and binary image format assertions"
```

## Parallel Example: User Story 2

```bash
# Coordinate side-effect edits in tests/integration/mobile-api.integration.test.ts:
Task: "T015 [US2] Split signin PostgreSQL side-effect assertions"
Task: "T018 [US2] Split upload PostgreSQL/filesystem/OpenAI side-effect assertions"
Task: "T023 [US2] Split debug logging status and redaction assertions"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 for response status and response format assertion names.
3. Stop and validate verbose output against the US1 independent test.
4. Commit or demo the MVP if only response readability is desired.

### Incremental Delivery

1. Complete Setup and Foundational phases.
2. Add US1 response assertion splitting and validate independently.
3. Add US2 persistence, filesystem, OpenAI-boundary, and logging assertion splitting and validate independently.
4. Add US3 scope and command validation.
5. Run final polish checks.

### Parallel Team Strategy

With multiple contributors, coordinate edits carefully because all implementation tasks target one file:

1. One contributor establishes the per-example setup helper style in tests/integration/mobile-api.integration.test.ts.
2. Contributors split endpoint-family assertion groups in short-lived patches.
3. A final integrator runs T028 through T032 to validate behavior and scope.

## Notes

- All implementation work must remain inside tests/integration/mobile-api.integration.test.ts.
- Do not add new test files.
- Do not change expected API status codes, response bodies, persistence behavior, setup, cleanup, or mocks.
- Do not split existing endpoint-level scenarios into additional endpoint-level `describe` blocks.
- Keep implementation MCP-free and use only repository commands from specs/008-integration-test-assertions/quickstart.md.
