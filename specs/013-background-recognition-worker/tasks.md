# Tasks: Background Recognition Worker

**Input**: Design documents from `/specs/013-background-recognition-worker/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/recognition-worker.md

**Tests**: Test tasks are REQUIRED for every user story and must preserve CI coverage >= 95%.

**Organization**: Tasks are grouped by user story so each story is independently implementable and testable.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare configuration and worker module scaffolding.

- [X] T001 Add worker configuration keys and defaults in src/infrastructure/config/api-config.ts
- [X] T002 Add worker configuration parsing tests in src/infrastructure/config/api-config.test.ts
- [X] T003 [P] Create worker adapter directory and module barrel in src/adapters/inbound/worker/index.ts
- [X] T004 [P] Add worker feature notes and env examples in specs/013-background-recognition-worker/quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add core queue-claiming primitives and wiring required by all stories.

**CRITICAL**: No user story tasks start before this phase is complete.

- [X] T005 Extend task-store port for FIFO claim and requeue operations in src/application/ports/recognition-task-store.port.ts
- [X] T006 Implement FIFO claim-with-lock query in src/adapters/outbound/postgres/recognition-task.repository.ts
- [X] T007 [P] Add repository tests for claim eligibility, ordering, and locking semantics in src/adapters/outbound/postgres/recognition-task.repository.test.ts
- [X] T008 Add worker service skeleton and poll-loop entrypoint in src/adapters/inbound/worker/recognition-task.worker.ts
- [X] T009 Wire worker provider into API dependency graph in src/api.module.ts
- [X] T010 [P] Add worker lifecycle bootstrap/teardown integration test in src/adapters/inbound/worker/recognition-task.worker.test.ts

**Checkpoint**: Foundation complete - user stories can proceed.

---

## Phase 3: User Story 1 - Process Queued Tasks (Priority: P1) 🎯 MVP

**Goal**: Automatically drain queued recognition tasks via polling worker and persist completed recognition outcomes.

**Independent Test**: Seed queued tasks with valid images, run worker cycle, verify tasks move queued -> processing -> successful and measurements are recognized.

### Tests for User Story 1 (REQUIRED)

- [X] T011 [P] [US1] Add use-case test for successful worker-driven completion in src/application/use-cases/process-recognition-task.use-case.test.ts
- [X] T012 [P] [US1] Add worker-cycle integration test for queued-to-completed flow in src/adapters/inbound/worker/recognition-task.worker.test.ts
- [X] T013 [US1] Add regression assertion for pending-to-recognized measurement lifecycle in src/application/use-cases/measurement-review.use-cases.test.ts

### Implementation for User Story 1

- [X] T014 [US1] Implement polling cycle that claims queued tasks by batch in src/adapters/inbound/worker/recognition-task.worker.ts
- [X] T015 [US1] Implement worker-to-use-case invocation and success metrics logging in src/adapters/inbound/worker/recognition-task.worker.ts
- [X] T016 [US1] Update task repository save/claim behavior for processing transition timestamps in src/adapters/outbound/postgres/recognition-task.repository.ts
- [X] T017 [US1] Add API module wiring for interval and batch config injection in src/api.module.ts

**Checkpoint**: US1 is independently functional and testable.

---

## Phase 4: User Story 2 - Handle Processing Failures Safely (Priority: P2)

**Goal**: Failures do not block queue progress; each task gets one retry on next cycle, then terminal failure.

**Independent Test**: Mix invalid and valid queued tasks, run multiple worker cycles, verify invalid tasks requeue once then fail while valid tasks complete.

### Tests for User Story 2 (REQUIRED)

- [X] T018 [P] [US2] Add test for first-failure requeue-on-next-cycle behavior in src/application/use-cases/process-recognition-task.use-case.test.ts
- [X] T019 [P] [US2] Add test for second-failure terminal transition to failed in src/application/use-cases/process-recognition-task.use-case.test.ts
- [X] T020 [US2] Add worker integration test for mixed valid/invalid queue progress in src/adapters/inbound/worker/recognition-task.worker.test.ts

### Implementation for User Story 2

- [X] T021 [US2] Implement retry scheduling with availableAt set to next cycle in src/application/use-cases/process-recognition-task.use-case.ts
- [X] T022 [US2] Implement terminal failure path after second failed attempt in src/application/use-cases/process-recognition-task.use-case.ts
- [X] T023 [US2] Persist retry/failed state transitions and lastError details in src/adapters/outbound/postgres/recognition-task.repository.ts
- [X] T024 [US2] Add per-cycle failure/ retry counters in worker logs in src/adapters/inbound/worker/recognition-task.worker.ts

**Checkpoint**: US2 is independently functional and testable.

---

## Phase 5: User Story 3 - Preserve Consistent Results (Priority: P3)

**Goal**: Background worker outcomes match existing prediction behavior and remain idempotent for terminal tasks.

**Independent Test**: Run parity dataset through existing prediction flow and worker flow; assert equivalent recognized values and no duplicate terminal outputs.

### Tests for User Story 3 (REQUIRED)

- [X] T025 [P] [US3] Add parity test comparing worker recognition outputs to existing prediction flow in src/application/use-cases/predict-images.use-case.test.ts
- [X] T026 [P] [US3] Add idempotency test ensuring terminal tasks are not reprocessed in src/adapters/inbound/worker/recognition-task.worker.test.ts
- [X] T027 [US3] Add repository test ensuring claim excludes completed/failed tasks in src/adapters/outbound/postgres/recognition-task.repository.test.ts

### Implementation for User Story 3

- [X] T028 [US3] Skip claim/execution for terminal tasks in worker cycle logic in src/adapters/inbound/worker/recognition-task.worker.ts
- [X] T029 [US3] Reuse existing model/provider selection path for worker processing in src/application/use-cases/process-recognition-task.use-case.ts
- [X] T030 [US3] Add duplicate-output guard in task state transition handling in src/application/use-cases/process-recognition-task.use-case.ts

**Checkpoint**: US3 is independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, validation, and documentation updates across stories.

- [X] T031 [P] Document new worker env vars and operations notes in README.md
- [X] T032 [P] Update feature quickstart verification steps in specs/013-background-recognition-worker/quickstart.md
- [X] T033 Run full backend validation and coverage gate in package.json via npm run test:coverage
- [X] T034 Run targeted queue processing regression suite in package.json via npm run test -- src/application/use-cases/process-recognition-task.use-case.test.ts src/adapters/inbound/worker/recognition-task.worker.test.ts
- [X] T035 Add SLA verification task for SC-001 (>=95% valid queued tasks reach successful within 5 minutes) with repeatable dataset/runbook and result capture in specs/013-background-recognition-worker/quickstart.md
- [X] T036 Add SC-004 health-check implementation and validation task for queued tasks older than 15 minutes, including query/metric and verification steps in specs/013-background-recognition-worker/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies.
- Foundational (Phase 2): Depends on Setup and blocks all user stories.
- User Stories (Phases 3-5): Depend on Foundational completion.
- Polish (Phase 6): Depends on completion of selected user stories.

### User Story Dependencies

- US1 (P1): Starts immediately after Foundational; defines MVP.
- US2 (P2): Starts after Foundational; depends on US1 worker loop presence but is independently testable.
- US3 (P3): Starts after Foundational; depends on US1 flow and can be tested independently with parity fixtures.

### Within Each User Story

- Write tests first and confirm they fail before implementation.
- Implement core behavior after tests.
- Validate story independently before moving to next priority.

### Parallel Opportunities

- T003 and T004 can run in parallel.
- T007 and T010 can run in parallel after T005/T006/T008 exist.
- US1 tests T011 and T012 can run in parallel.
- US2 tests T018 and T019 can run in parallel.
- US3 tests T025 and T026 can run in parallel.
- Polish docs tasks T031 and T032 can run in parallel.

---

## Parallel Example: User Story 2

```bash
# Parallel test authoring for US2
Task: "Add test for first-failure requeue-on-next-cycle behavior in src/application/use-cases/process-recognition-task.use-case.test.ts"
Task: "Add test for second-failure terminal transition to failed in src/application/use-cases/process-recognition-task.use-case.test.ts"

# Parallel execution once tests exist
Task: "Add worker integration test for mixed valid/invalid queue progress in src/adapters/inbound/worker/recognition-task.worker.test.ts"
Task: "Persist retry/failed state transitions and lastError details in src/adapters/outbound/postgres/recognition-task.repository.ts"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Setup (Phase 1).
2. Complete Foundational (Phase 2).
3. Complete US1 (Phase 3).
4. Validate US1 independently via queued-to-completed flow.

### Incremental Delivery

1. Deliver MVP with US1.
2. Add failure-safe retry/terminal handling with US2.
3. Add parity/idempotency protections with US3.
4. Execute Polish phase validation and documentation.

### Parallel Team Strategy

1. Team aligns on Setup + Foundational tasks first.
2. After Foundational:
   - Developer A: US1 orchestration + tests.
   - Developer B: US2 retry/failure semantics + tests.
   - Developer C: US3 parity/idempotency + tests.
3. Merge by story checkpoints to preserve independent testability.

---

## Notes

- [P] tasks are explicitly parallelizable and touch independent files or decoupled concerns.
- Existing tests should not be rewritten unless required by feature-correctness changes.
- Keep feature development isolated to `tmp/015-background-worker` and MCP-free.
- Prefer official NestJS modules before introducing third-party queue frameworks.
