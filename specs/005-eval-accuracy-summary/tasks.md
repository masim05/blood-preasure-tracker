# Tasks: Eval Accuracy Summary

**Input**: Design documents from `/specs/005-eval-accuracy-summary/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli.md, quickstart.md

**Tests**: Test tasks are REQUIRED. Every user story includes new tests, preserves existing tests unless justified, and maintains CI coverage >= 95%.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the isolated implementation workspace and confirm the repo baseline before feature work.

- [X] T001 Create implementation worktree for branch 005-eval-accuracy-summary at tmp/005-eval-accuracy-summary
- [X] T002 Install dependencies in tmp/005-eval-accuracy-summary with npm ci
- [X] T003 [P] Review eval output contract in specs/005-eval-accuracy-summary/contracts/cli.md before coding
- [X] T004 [P] Confirm no new runtime dependency is required in package.json

## Constitution Check

**Purpose**: Explicit task-list compliance check required by the project constitution.

- [X] Hexagonal boundaries preserved: domain computes accuracy, use case orchestrates output, CLI adapter writes stdout text.
- [X] Unit test strategy present: output writer, report aggregation, formatter, use case, and CLI integration tests are planned.
- [X] Coverage policy acknowledged: full validation includes `npm run test:coverage` and changed feature paths target full branch coverage where practical.
- [X] Additive test evolution respected: existing tests receive additive assertions only.
- [X] MCP-free implementation: tasks use local repository scripts, npm, Jest, TypeScript, and Node built-ins only.
- [X] Feature isolation via worktree: implementation is in `tmp/005-eval-accuracy-summary`.
- [X] Tech stack baseline: Node.js 24.x LTS and NestJS 11 remain the target.
- [X] Dependency policy: no new third-party runtime dependency is planned.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared output plumbing required before any user story can append human-readable eval text.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 [P] Add raw text output unit tests in tests/unit/adapters/jsonl-output.writer.test.ts
- [X] T006 Extend OutputWriterPort with optional raw text writing in src/application/ports/output-writer.port.ts
- [X] T007 Implement backpressure-safe raw text writing in src/adapters/inbound/cli/jsonl-output.writer.ts
- [X] T008 Run targeted output writer tests with npm test -- tests/unit/adapters/jsonl-output.writer.test.ts

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - See Per-Field Accuracy Totals (Priority: P1) MVP

**Goal**: Eval reports correct/total and percentage rows for `hand`, `systolic`, `diastolic`, and `pulse` after existing JSONL output.

**Independent Test**: Run eval against controlled comparisons and verify per-field `hand`, `systolic`, `diastolic`, and `pulse` summary rows report exact counts and one-decimal percentages while existing JSONL comparison and summary records remain unchanged.

### Tests for User Story 1 (REQUIRED)

- [X] T009 [P] [US1] Add EvaluationReport per-field accuracy tests in tests/unit/domain/evaluation-report.test.ts
- [X] T010 [P] [US1] Add EvaluationReport missing-field and unmatched-row denominator tests in tests/unit/domain/evaluation-report.test.ts
- [X] T011 [P] [US1] Add eval use-case output order test for comparison records, summary record, and per-field text in tests/unit/application/evaluate-images.use-case.test.ts
- [X] T012 [P] [US1] Add CLI integration assertion for per-field eval accuracy rows in tests/integration/cli.integration.test.ts

### Implementation for User Story 1

- [X] T013 [US1] Add FieldAccuracyMetric and AccuracySummary types in src/domain/entities/evaluation-report.ts
- [X] T014 [US1] Implement per-field accuracy summary computation in src/domain/entities/evaluation-report.ts
- [X] T015 [US1] Add initial per-field accuracy formatter in src/domain/services/evaluation-accuracy-formatter.ts
- [X] T016 [US1] Emit per-field accuracy text after existing eval summary in src/application/use-cases/evaluate-images.use-case.ts
- [X] T017 [US1] Run US1 tests with npm test -- tests/unit/domain/evaluation-report.test.ts tests/unit/application/evaluate-images.use-case.test.ts tests/integration/cli.integration.test.ts

**Checkpoint**: User Story 1 is independently functional and testable as the MVP.

---

## Phase 4: User Story 2 - See Multi-Parameter Correctness Totals (Priority: P2)

**Goal**: Eval reports threshold rows for readings with at least 2, at least 3, and all 4 target parameters correct.

**Independent Test**: Run eval against controlled comparison outcomes and verify `2 params correct`, `3 params correct`, and `4 params correct` rows use the comparable-record denominator and exact threshold counts.

### Tests for User Story 2 (REQUIRED)

- [X] T018 [P] [US2] Add threshold metric aggregation tests in tests/unit/domain/evaluation-report.test.ts
- [X] T019 [P] [US2] Add formatter tests for threshold rows in tests/unit/domain/evaluation-accuracy-formatter.test.ts
- [X] T020 [P] [US2] Add CLI integration assertion for threshold eval accuracy rows in tests/integration/cli.integration.test.ts

### Implementation for User Story 2

- [X] T021 [US2] Add ParameterThresholdMetric type in src/domain/entities/evaluation-report.ts
- [X] T022 [US2] Implement at-least-2, at-least-3, and at-least-4 metric computation in src/domain/entities/evaluation-report.ts
- [X] T023 [US2] Extend formatter with threshold rows in src/domain/services/evaluation-accuracy-formatter.ts
- [X] T024 [US2] Run US2 tests with npm test -- tests/unit/domain/evaluation-report.test.ts tests/unit/domain/evaluation-accuracy-formatter.test.ts tests/integration/cli.integration.test.ts

**Checkpoint**: User Stories 1 and 2 both work independently and together.

---

## Phase 5: User Story 3 - Read A Polished Aligned Summary (Priority: P3)

**Goal**: Summary labels, fractions, and percentages align consistently across rows with different label lengths and digit widths.

**Independent Test**: Run formatter and CLI tests with varied numerator/denominator digit counts and verify all fraction columns and percentage columns start at the same positions.

### Tests for User Story 3 (REQUIRED)

- [X] T025 [P] [US3] Add formatter alignment and one-decimal percentage tests in tests/unit/domain/evaluation-accuracy-formatter.test.ts
- [X] T026 [P] [US3] Add zero-comparable-record formatting tests in tests/unit/domain/evaluation-accuracy-formatter.test.ts
- [X] T027 [P] [US3] Add maximum 10-line summary cap test in tests/unit/domain/evaluation-accuracy-formatter.test.ts
- [X] T028 [P] [US3] Add quickstart-style eval output shape assertion in tests/integration/cli.integration.test.ts

### Implementation for User Story 3

- [X] T029 [US3] Finalize fixed-width label, fraction, and percentage formatting in src/domain/services/evaluation-accuracy-formatter.ts
- [X] T030 [US3] Ensure zero comparable records render 0/0 and 0.0% in src/domain/services/evaluation-accuracy-formatter.ts
- [X] T031 [US3] Run US3 tests with npm test -- tests/unit/domain/evaluation-accuracy-formatter.test.ts tests/integration/cli.integration.test.ts

**Checkpoint**: All user stories are independently functional and aligned with the CLI contract.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and release hygiene across all stories.

- [X] T032 [P] Update eval output documentation in README.md
- [X] T033 [P] Update quickstart validation notes in specs/005-eval-accuracy-summary/quickstart.md if implementation output differs only in exact counts
- [X] T034 Run full build from tmp/005-eval-accuracy-summary using package.json and tsconfig.json
- [X] T035 Run full test suite from tmp/005-eval-accuracy-summary using package.json and jest.config.ts
- [X] T036 Run coverage gate from tmp/005-eval-accuracy-summary using package.json and jest.config.ts
- [X] T037 Run lint from tmp/005-eval-accuracy-summary using package.json and eslint.config.js
- [X] T038 Commit implementation changes from tmp/005-eval-accuracy-summary on branch 005-eval-accuracy-summary
- [X] T039 Push branch 005-eval-accuracy-summary from tmp/005-eval-accuracy-summary to origin
- [X] T040 Create PR/MR from branch 005-eval-accuracy-summary to main using specs/005-eval-accuracy-summary/plan.md and specs/005-eval-accuracy-summary/tasks.md for description context

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational completion and delivers MVP.
- **User Story 2 (Phase 4)**: Depends on Foundational completion; can be developed after or alongside US1 once shared summary shape exists.
- **User Story 3 (Phase 5)**: Depends on Foundational completion; final alignment is easiest after US1 and US2 rows exist.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - no dependency on US2 or US3.
- **User Story 2 (P2)**: Can start after Foundational; integrates with the same `AccuracySummary` domain model introduced by US1.
- **User Story 3 (P3)**: Can start after Foundational; validates and finalizes formatting for rows from US1 and US2.

### Within Each User Story

- Tests must be written and fail before implementation.
- Domain model changes before formatter changes.
- Formatter changes before use-case emission changes.
- Story-specific tests must pass before moving to the next story.

---

## Parallel Opportunities

- T003 and T004 can run in parallel after T001/T002 start.
- T005 can run in parallel with T006 because tests and port updates are separate files.
- US1 tests T009, T010, and T011 can be written in parallel.
- US2 tests T017, T018, and T019 can be written in parallel.
- US3 tests T024, T025, and T026 can be written in parallel.
- Documentation tasks T030 and T031 can run in parallel after implementation behavior is stable.

---

## Parallel Example: User Story 1

```bash
# Launch all US1 test authoring tasks together:
Task: "T009 [P] [US1] Add EvaluationReport per-field accuracy tests in tests/unit/domain/evaluation-report.test.ts"
Task: "T010 [P] [US1] Add eval use-case output order test for comparison records, summary record, and per-field text in tests/unit/application/evaluate-images.use-case.test.ts"
Task: "T011 [P] [US1] Add CLI integration assertion for per-field eval accuracy rows in tests/integration/cli.integration.test.ts"
```

## Parallel Example: User Story 2

```bash
# Launch all US2 test authoring tasks together:
Task: "T017 [P] [US2] Add threshold metric aggregation tests in tests/unit/domain/evaluation-report.test.ts"
Task: "T018 [P] [US2] Add formatter tests for threshold rows in tests/unit/domain/evaluation-accuracy-formatter.test.ts"
Task: "T019 [P] [US2] Add CLI integration assertion for threshold eval accuracy rows in tests/integration/cli.integration.test.ts"
```

## Parallel Example: User Story 3

```bash
# Launch all US3 test authoring tasks together:
Task: "T024 [P] [US3] Add formatter alignment and one-decimal percentage tests in tests/unit/domain/evaluation-accuracy-formatter.test.ts"
Task: "T025 [P] [US3] Add zero-comparable-record formatting tests in tests/unit/domain/evaluation-accuracy-formatter.test.ts"
Task: "T026 [P] [US3] Add quickstart-style eval output shape assertion in tests/integration/cli.integration.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational raw text output plumbing.
3. Complete Phase 3: User Story 1 per-field accuracy totals.
4. Stop and validate with T016 plus full build/test if preparing a demo.

### Incremental Delivery

1. Setup + Foundation -> output writer can append human-readable text safely.
2. Add US1 -> per-field accuracy rows deliver the requested core value.
3. Add US2 -> threshold rows show practical full-reading quality.
4. Add US3 -> aligned output is polished and stable across digit widths.
5. Complete Polish -> docs, build, tests, coverage, lint, commit, push, PR/MR.

### Single-Developer Strategy

Complete tasks sequentially by phase. Use the parallel markers as guidance for low-conflict task grouping, but keep story checkpoints green before moving forward.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks.
- [US1], [US2], and [US3] labels map to user stories in spec.md.
- Existing JSONL comparison and summary records must remain unchanged.
- New human-readable accuracy text must appear after the existing JSONL summary record.
- Keep implementation in tmp/005-eval-accuracy-summary and development MCP-free.
- Keep runtime on Node.js 24.x LTS and NestJS 11.
- Do not add third-party dependencies for formatting.
- Preserve CI coverage >= 95%, targeting full coverage for changed aggregation and formatting paths.