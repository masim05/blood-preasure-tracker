# Tasks: Predict CSV Output

**Input**: Design documents from `/specs/004-predict-csv-output/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli.md, quickstart.md

**Tests**: Test tasks are REQUIRED. Every user story includes new tests, preserves existing tests unless justified, and maintains CI coverage >= 95%.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Every task includes an exact file path

## Constitution Check

- [X] **Hexagonal boundaries defined**: Tasks add `PredictionCsvWriterPort`, isolate filesystem CSV writing in `prediction-csv.writer.ts`, and keep eval CSV parsing behind `EvaluationDatasetPort`.
- [X] **Unit test strategy present**: Tasks include required unit, contract, and integration tests for each user story.
- [X] **Coverage policy acknowledged**: Tasks include `npm run test:coverage` and require overall coverage to remain >= 95%.
- [X] **Additive test evolution respected**: Tasks preserve existing tests except where new `p.csv` behavior or parser compatibility requires updates.
- [X] **MCP-free implementation**: Tasks use local repository files, npm scripts, TypeScript, Jest, and Node.js APIs only.
- [X] **Feature isolation via worktree**: T001 creates `tmp/004-predict-csv-output` for branch `004-predict-csv-output`.
- [X] **Tech stack baseline**: Tasks inherit the latest active Node.js LTS and NestJS 11 baseline from the implementation plan.
- [X] **Dependency policy**: No third-party CSV dependency is planned; implementation uses official Node.js file and stream APIs.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the isolated implementation workspace and verify baseline project commands.

- [X] T001 Create feature worktree `tmp/004-predict-csv-output` for branch `004-predict-csv-output`
- [X] T002 Verify baseline npm scripts in `package.json` with `npm run build`, `npm test`, `npm run test:coverage`, and `npm run lint`
- [X] T003 [P] Review CLI output contract in `specs/004-predict-csv-output/contracts/cli.md` before implementation
- [X] T004 [P] Review quickstart validation flow in `specs/004-predict-csv-output/quickstart.md` before implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared CSV artifact abstractions and schema helpers required before user stories can be implemented.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 Define `PredictionCsvWriterPort` lifecycle contract in `src/application/ports/prediction-csv-writer.port.ts`
- [X] T006 [P] Add fixed prediction CSV header and row mapping types in `src/domain/services/prediction-csv-schema.ts`
- [X] T007 [P] Add CSV escaping and nullable cell formatting helpers in `src/domain/services/csv-formatting.ts`
- [X] T008 Export new port and CSV schema utilities from `src/index.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Generate Prediction CSV (Priority: P1) MVP

**Goal**: `npm run cli -- predict --input <directory>` creates/replaces `<directory>/p.csv`, writes the stable header, and streams one row per processed image including partial/error rows.

**Independent Test**: Run `predict` against a controlled input directory and verify `<input>/p.csv` has the exact header, empty-cell nulls, JSON-string `uncertainFields`, replacement behavior, and one row per processed image.

### Tests for User Story 1 (REQUIRED)

- [X] T009 [P] [US1] Add unit tests for CSV escaping, empty cells, numeric cells, and JSON-array `uncertainFields` formatting in `tests/unit/domain/prediction-csv-schema.test.ts`
- [X] T010 [P] [US1] Add unit tests for header creation, stale file replacement, streamed row writes, backpressure, close, and write errors in `tests/unit/adapters/prediction-csv.writer.test.ts`
- [X] T011 [P] [US1] Add use-case or integration test proving `predict` reports a clear failure when `<input>/p.csv` cannot be written in `tests/unit/application/predict-images.use-case.test.ts` or `tests/integration/cli.integration.test.ts`
- [X] T012 [P] [US1] Add predict use-case tests for opening `p.csv`, writing rows per image, including partial/error rows, and closing writer in `tests/unit/application/predict-images.use-case.test.ts`
- [X] T013 [P] [US1] Add integration test for `predict` creating `<input>/p.csv` with expected rows in `tests/integration/cli.integration.test.ts`
- [X] T014 [P] [US1] Add integration test for empty input directory producing header-only `p.csv` in `tests/integration/cli.integration.test.ts`

### Implementation for User Story 1

- [X] T015 [US1] Implement prediction CSV row schema conversion in `src/domain/services/prediction-csv-schema.ts`
- [X] T016 [US1] Implement CSV escaping and cell serialization in `src/domain/services/csv-formatting.ts`
- [X] T017 [US1] Implement filesystem streaming writer adapter in `src/adapters/outbound/filesystem/prediction-csv.writer.ts`
- [X] T018 [US1] Update `PredictImagesUseCase` to open the CSV writer before image processing in `src/application/use-cases/predict-images.use-case.ts`
- [X] T019 [US1] Update `PredictImagesUseCase` to write one CSV row after each produced prediction in `src/application/use-cases/predict-images.use-case.ts`
- [X] T020 [US1] Update `PredictImagesUseCase` to close or release the CSV writer on success and failure in `src/application/use-cases/predict-images.use-case.ts`
- [X] T021 [US1] Wire `PredictionCsvWriterPort` adapter construction in `src/main.ts`
- [X] T022 [US1] Register prediction CSV writer provider in `src/app.module.ts`

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Reuse Prediction CSV In Eval (Priority: P2)

**Goal**: `npm run cli -- eval --input <directory> --csv <directory>/p.csv` accepts generated prediction CSV files as reference data, ignores service columns, and compares fresh predictions against the six core reading columns.

**Independent Test**: Generate or fixture a `p.csv` with service columns, run eval with it, and verify CSV parsing succeeds while malformed or missing required core columns still fail clearly.

### Tests for User Story 2 (REQUIRED)

- [X] T023 [P] [US2] Add CSV dataset adapter tests accepting generated `p.csv` service columns in `tests/unit/adapters/csv-dataset.adapter.test.ts`
- [X] T024 [P] [US2] Add CSV dataset adapter tests rejecting missing core columns while ignoring extra service columns in `tests/unit/adapters/csv-dataset.adapter.test.ts`
- [X] T025 [P] [US2] Add contract test for `eval --csv p.csv` treating generated CSV as reference data in `tests/contract/cli.contract.test.ts`
- [X] T026 [P] [US2] Add integration test for predict-generated `p.csv` accepted by eval in `tests/integration/cli.integration.test.ts`

### Implementation for User Story 2

- [X] T027 [US2] Update CSV header validation to require only core columns in `src/adapters/outbound/filesystem/csv-dataset.adapter.ts`
- [X] T028 [US2] Update CSV row parsing to ignore service information columns in `src/adapters/outbound/filesystem/csv-dataset.adapter.ts`
- [X] T029 [US2] Preserve strict duplicate imageId, hand, and numeric validation in `src/adapters/outbound/filesystem/csv-dataset.adapter.ts`
- [X] T030 [US2] Update eval CLI documentation for generated `p.csv` reference semantics in `README.md`

**Checkpoint**: User Story 2 works independently after US1 creates a valid `p.csv` artifact.

---

## Phase 5: User Story 3 - Preserve Existing Stream Output (Priority: P3)

**Goal**: Existing consumers continue receiving JSONL prediction records while `predict` also writes `p.csv`.

**Independent Test**: Run `predict` and verify JSONL prediction output is unchanged in shape and count while `<input>/p.csv` is also present.

### Tests for User Story 3 (REQUIRED)

- [X] T031 [P] [US3] Add use-case test proving JSONL output writer still receives prediction records while CSV writer receives rows in `tests/unit/application/predict-images.use-case.test.ts`
- [X] T032 [P] [US3] Add integration test proving CLI stdout still emits prediction JSONL while `p.csv` is written in `tests/integration/cli.integration.test.ts`

### Implementation for User Story 3

- [X] T033 [US3] Preserve output writer call order and payload shape in `src/application/use-cases/predict-images.use-case.ts`
- [X] T034 [US3] Update README command/output docs for simultaneous JSONL and `p.csv` output in `README.md`

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, coverage, and documentation checks across all user stories.

- [X] T035 [P] Update generated CSV examples in `specs/004-predict-csv-output/quickstart.md` if implementation details require wording corrections
- [X] T036 [P] Update CLI contract examples in `specs/004-predict-csv-output/contracts/cli.md` if final output differs only in model/provider sample values
- [X] T037 Run `npm run build` from `package.json` and fix any TypeScript errors in `src/`
- [X] T038 Run `npm test` from `package.json` and fix failing tests in `tests/`
- [X] T039 Run `npm run test:coverage` from `package.json` and ensure overall coverage remains >= 95%
- [X] T040 Run `npm run lint` from `package.json` and fix lint issues in `src/` and `tests/`
- [X] T041 Execute quickstart predict/eval validation from `specs/004-predict-csv-output/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational; delivers MVP CSV generation
- **User Story 2 (Phase 4)**: Depends on Foundational and is easiest to validate after US1 produces generated `p.csv`
- **User Story 3 (Phase 5)**: Depends on Foundational and the US1 predict orchestration path
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 Generate Prediction CSV (P1)**: Can start after Foundational - no dependency on US2 or US3
- **US2 Reuse Prediction CSV In Eval (P2)**: Can start after Foundational using fixture CSVs; full round-trip integration depends on US1
- **US3 Preserve Existing Stream Output (P3)**: Can start after Foundational using mocked CSV writer; full CLI validation depends on US1

### Within Each User Story

- Tests must be written and fail before implementation
- Domain services/helpers before filesystem adapters
- Ports before use-case wiring
- Adapter implementation before CLI/main wiring
- Story complete before moving to the next priority when working sequentially

### Parallel Opportunities

- T003 and T004 can run in parallel during Setup
- T006 and T007 can run in parallel after T005
- T009-T014 can run in parallel because they touch different test scopes or distinct test sections
- T015 and T016 can run in parallel after foundational types are defined
- T023-T026 can run in parallel for US2 test coverage
- T031 and T032 can run in parallel for US3 test coverage
- T035 and T036 can run in parallel during polish

---

## Parallel Example: User Story 1

```bash
# Launch US1 test-writing tasks together:
Task: "T009 [P] [US1] Add unit tests for CSV escaping, empty cells, numeric cells, and JSON-array uncertainFields formatting in tests/unit/domain/prediction-csv-schema.test.ts"
Task: "T010 [P] [US1] Add unit tests for header creation, stale file replacement, streamed row writes, backpressure, close, and write errors in tests/unit/adapters/prediction-csv.writer.test.ts"
Task: "T011 [P] [US1] Add use-case or integration test proving predict reports a clear failure when <input>/p.csv cannot be written in tests/unit/application/predict-images.use-case.test.ts or tests/integration/cli.integration.test.ts"
Task: "T012 [P] [US1] Add predict use-case tests for opening p.csv, writing rows per image, including partial/error rows, and closing writer in tests/unit/application/predict-images.use-case.test.ts"
Task: "T013 [P] [US1] Add integration test for predict creating <input>/p.csv with expected rows in tests/integration/cli.integration.test.ts"
Task: "T014 [P] [US1] Add integration test for empty input directory producing header-only p.csv in tests/integration/cli.integration.test.ts"
```

---

## Parallel Example: User Story 2

```bash
# Launch US2 test-writing tasks together:
Task: "T023 [P] [US2] Add CSV dataset adapter tests accepting generated p.csv service columns in tests/unit/adapters/csv-dataset.adapter.test.ts"
Task: "T024 [P] [US2] Add CSV dataset adapter tests rejecting missing core columns while ignoring extra service columns in tests/unit/adapters/csv-dataset.adapter.test.ts"
Task: "T025 [P] [US2] Add contract test for eval --csv p.csv treating generated CSV as reference data in tests/contract/cli.contract.test.ts"
Task: "T026 [P] [US2] Add integration test for predict-generated p.csv accepted by eval in tests/integration/cli.integration.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Stop and validate: `predict` creates/replaces `<input>/p.csv`, streams rows, handles empty directories, and writes partial/error rows
5. Demo MVP using `npm run cli -- predict --input ./data/eval`

### Incremental Delivery

1. Complete Setup + Foundational -> CSV schema and writer port ready
2. Add US1 -> `predict` creates `p.csv` -> test independently
3. Add US2 -> `eval --csv p.csv` accepts generated CSV as reference -> test independently
4. Add US3 -> JSONL prediction output remains intact -> test independently
5. Run polish validation commands and quickstart

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Developer A implements US1 writer/use-case flow
3. Developer B implements US2 CSV parser compatibility using fixture `p.csv`
4. Developer C implements US3 output preservation tests and docs
5. Team integrates and runs full validation

---

## Notes

- [P] tasks use different files or independent test sections and can run in parallel
- [US1], [US2], and [US3] labels map tasks directly to spec user stories
- New tests should fail before implementation
- Do not modify pre-existing tests unless required by the new `p.csv` behavior or documented parser compatibility requirements
- Keep CI coverage at or above 95%, targeting 100% for changed CSV writer/parser/use-case areas
- Keep implementation MCP-free and in `tmp/004-predict-csv-output`
