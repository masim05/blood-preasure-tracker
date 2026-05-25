# Tasks: CLI Eval Tool

**Input**: Design documents from `/specs/001-cli-eval-tool/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are REQUIRED. Every user story MUST include new tests, preserve existing tests unless justified, and maintain CI coverage >= 95%.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths below follow the chosen single-project CLI structure from plan.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and baseline tooling for the local-only extraction pipeline

- [ ] T001 Verify the active feature worktree path in `specs/001-cli-eval-tool/implementation-notes.md`
- [ ] T002 Update local OCR and metadata dependencies in `package.json`
- [ ] T003 [P] Refresh TypeScript and Jest configuration for fixture-heavy local parsing tests in `tsconfig.json` and `jest.config.ts`
- [ ] T004 [P] Update local-only configuration examples in `.env.example` and `.gitignore`
- [ ] T005 Create fixture guidance for metadata and OCR samples in `tests/fixtures/README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Replace runtime configuration loading for local extraction settings in `src/infrastructure/config/env-config.ts`
- [ ] T007 Implement CLI configuration resolution for local paths and OCR threshold in `src/infrastructure/config/cli-config.ts` and `src/adapters/inbound/cli/cli-parser.ts`
- [ ] T008 [P] Replace `src/application/ports/llm-provider.port.ts` with local extraction ports in `src/application/ports/image-metadata.port.ts` and `src/application/ports/local-reading-extractor.port.ts`
- [ ] T009 [P] Retire obsolete provider/model abstractions in `src/application/ports/model-catalog.port.ts`, `src/application/use-cases/list-models.use-case.ts`, and `src/adapters/outbound/llm/model-registry.ts`
- [ ] T010 [P] Add shared local extraction configuration entity in `src/domain/entities/local-extraction-configuration.ts`
- [ ] T011 [P] Refactor shared predicted reading entity for metadata and OCR output in `src/domain/entities/predicted-reading.ts`
- [ ] T012 Implement shared uncertainty rules for metadata and OCR fields in `src/domain/services/uncertainty-policy.ts`
- [ ] T013 Wire local metadata and OCR adapters in `src/app.module.ts`
- [ ] T014 Update the CLI bootstrap shell for local-only execution in `src/main.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Predict Blood Pressure Readings (Priority: P1) 🎯 MVP

**Goal**: Process a directory of monitor images and emit one JSONL prediction record per image using image metadata for `time` and offline OCR/parsing for reading values.

**Independent Test**: Run `npm run cli -- predict` against fixture images and confirm one JSONL prediction per image, `time` comes from image metadata, and uncertain fields are flagged without any external API dependency.

### Tests for User Story 1 (REQUIRED) ⚠️

> **NOTE: These tests are mandatory. Write them first and ensure they fail before implementation.**

- [ ] T015 [P] [US1] Add image metadata adapter tests in `tests/unit/adapters/image-metadata.adapter.test.ts`
- [ ] T016 [P] [US1] Add local OCR extraction adapter tests in `tests/unit/adapters/local-reading-extractor.adapter.test.ts`
- [ ] T017 [P] [US1] Add prediction use-case tests in `tests/unit/application/predict-images.use-case.test.ts`
- [ ] T018 [P] [US1] Extend uncertainty policy tests for metadata-missing cases in `tests/unit/domain/uncertainty-policy.test.ts`
- [ ] T019 [P] [US1] Add predict CLI integration tests in `tests/integration/cli.integration.test.ts`

### Implementation for User Story 1

- [ ] T020 [P] [US1] Update image loading for local parsing fixtures in `src/adapters/outbound/filesystem/image-directory.adapter.ts`
- [ ] T021 [P] [US1] Implement image metadata extraction adapter in `src/adapters/outbound/filesystem/image-metadata.adapter.ts`
- [ ] T022 [P] [US1] Implement offline OCR extraction adapter in `src/adapters/outbound/ocr/local-reading-extractor.adapter.ts`
- [ ] T023 [P] [US1] Implement monitor reading parser service in `src/domain/services/monitor-reading-parser.ts`
- [ ] T024 [US1] Refactor prediction orchestration for metadata plus OCR extraction in `src/application/use-cases/predict-images.use-case.ts`
- [ ] T025 [US1] Integrate `predict` command flow and prediction JSONL output in `src/main.ts` and `src/adapters/inbound/cli/jsonl-output.writer.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Evaluate Predictions Against Ground Truth (Priority: P2)

**Goal**: Compare locally extracted readings against CSV ground truth matched by filename stem and emit per-image comparison records plus a summary record.

**Independent Test**: Run `npm run cli -- eval` with sample images and `data/eval/a.csv` and confirm deterministic filename-stem matching, comparison output, metadata-missing handling, and final aggregate summary.

### Tests for User Story 2 (REQUIRED) ⚠️

> **NOTE: These tests are mandatory for new feature behavior.**

- [ ] T026 [P] [US2] Add evaluation matcher tests in `tests/unit/domain/evaluation-matcher.test.ts`
- [ ] T027 [P] [US2] Add evaluation report and use-case tests in `tests/unit/domain/evaluation-report.test.ts` and `tests/unit/application/evaluate-images.use-case.test.ts`
- [ ] T028 [P] [US2] Add CSV dataset and duplicate-stem validation tests in `tests/unit/adapters/csv-dataset.adapter.test.ts`
- [ ] T029 [P] [US2] Extend CLI integration tests for `eval` mode in `tests/integration/cli.integration.test.ts`

### Implementation for User Story 2

- [ ] T030 [P] [US2] Implement ground-truth and evaluation report entities in `src/domain/entities/ground-truth-record.ts` and `src/domain/entities/evaluation-report.ts`
- [ ] T031 [P] [US2] Implement filename-stem matching service in `src/domain/services/evaluation-matcher.ts`
- [ ] T032 [P] [US2] Implement CSV dataset adapter in `src/adapters/outbound/filesystem/csv-dataset.adapter.ts`
- [ ] T033 [US2] Implement evaluation orchestration in `src/application/use-cases/evaluate-images.use-case.ts`
- [ ] T034 [US2] Extend JSONL comparison and summary output in `src/adapters/inbound/cli/jsonl-output.writer.ts`
- [ ] T035 [US2] Integrate `eval` command flow in `src/main.ts`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Inspect Local Configuration and Help Output (Priority: P3)

**Goal**: Expose local configuration behavior and help output that describes metadata-based timestamps and offline execution.

**Independent Test**: Run `npm run cli -- --help` and local `.env`-backed predict/eval flows to confirm default paths, OCR threshold handling, and no external API requirement.

### Tests for User Story 3 (REQUIRED) ⚠️

> **NOTE: These tests are mandatory for new feature behavior.**

- [ ] T036 [P] [US3] Add help renderer tests for local configuration guidance in `tests/unit/adapters/help-renderer.test.ts`
- [ ] T037 [P] [US3] Add CLI config and env precedence tests in `tests/unit/infrastructure/cli-config.test.ts` and `tests/unit/infrastructure/env-config.test.ts`
- [ ] T038 [P] [US3] Extend CLI integration tests for help output and `.env`-backed local defaults in `tests/integration/cli.integration.test.ts`

### Implementation for User Story 3

- [ ] T039 [P] [US3] Implement local help renderer in `src/adapters/inbound/cli/help-renderer.ts`
- [ ] T040 [P] [US3] Remove provider/model CLI options and add OCR-threshold/local-path handling in `src/adapters/inbound/cli/cli-parser.ts` and `src/infrastructure/config/cli-config.ts`
- [ ] T041 [US3] Integrate help output and local configuration messaging in `src/main.ts`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T042 [P] Document local-only CLI usage and dataset expectations in `README.md`
- [ ] T043 Update local configuration examples and defaults in `.env.example`
- [ ] T044 [P] Add fixture dataset notes and validated commands in `specs/001-cli-eval-tool/quickstart.md`
- [ ] T045 [P] Refresh local adapter boundary tests in `tests/contract/`
- [ ] T046 Run coverage hardening and close remaining gaps in `tests/`
- [ ] T047 Run quickstart validation and record final command set in `specs/001-cli-eval-tool/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel if staffed
  - Sequential priority remains P1 -> P2 -> P3 for safest delivery
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - establishes local metadata and OCR prediction flow
- **User Story 2 (P2)**: Can start after Foundational (Phase 2), but practically depends on US1 prediction output shape for eval comparisons
- **User Story 3 (P3)**: Can start after Foundational (Phase 2), but benefits from US1/US2 command wiring already existing

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Ports/entities before use cases
- Use cases before CLI integration
- Core implementation before cross-command refinement
- Story complete before moving to next priority for MVP delivery

### Parallel Opportunities

- Setup tasks marked [P] can run in parallel
- Foundational port/entity cleanup tasks marked [P] can run in parallel
- In US1, metadata adapter tests, OCR adapter tests, use-case tests, and adapter implementations can run in parallel across separate files
- In US2, matcher tests, CSV adapter tests, entities, and domain service work can run in parallel
- In US3, help rendering, config/env tests, and CLI help integration can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch US1 tests together:
Task: "Add image metadata adapter tests in tests/unit/adapters/image-metadata.adapter.test.ts"
Task: "Add local OCR extraction adapter tests in tests/unit/adapters/local-reading-extractor.adapter.test.ts"
Task: "Add prediction use-case tests in tests/unit/application/predict-images.use-case.test.ts"

# Launch US1 adapter/service work together:
Task: "Implement image metadata extraction adapter in src/adapters/outbound/filesystem/image-metadata.adapter.ts"
Task: "Implement offline OCR extraction adapter in src/adapters/outbound/ocr/local-reading-extractor.adapter.ts"
Task: "Implement monitor reading parser service in src/domain/services/monitor-reading-parser.ts"
```

## Parallel Example: User Story 2

```bash
# Launch US2 tests together:
Task: "Add evaluation matcher tests in tests/unit/domain/evaluation-matcher.test.ts"
Task: "Add CSV dataset and duplicate-stem validation tests in tests/unit/adapters/csv-dataset.adapter.test.ts"

# Launch US2 domain work together:
Task: "Implement ground-truth and evaluation report entities in src/domain/entities/ground-truth-record.ts and src/domain/entities/evaluation-report.ts"
Task: "Implement filename-stem matching service in src/domain/services/evaluation-matcher.ts"
Task: "Implement CSV dataset adapter in src/adapters/outbound/filesystem/csv-dataset.adapter.ts"
```

## Parallel Example: User Story 3

```bash
# Launch US3 tests together:
Task: "Add help renderer tests for local configuration guidance in tests/unit/adapters/help-renderer.test.ts"
Task: "Add CLI config and env precedence tests in tests/unit/infrastructure/cli-config.test.ts and tests/unit/infrastructure/env-config.test.ts"

# Launch US3 implementation together:
Task: "Implement local help renderer in src/adapters/inbound/cli/help-renderer.ts"
Task: "Remove provider/model CLI options and add OCR-threshold/local-path handling in src/adapters/inbound/cli/cli-parser.ts and src/infrastructure/config/cli-config.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test `npm run cli -- predict` independently against metadata-bearing fixtures
5. Demo local prediction output and uncertainty behavior before adding eval/help refinements

### Incremental Delivery

1. Complete Setup + Foundational -> foundation ready
2. Add User Story 1 -> validate metadata plus OCR prediction JSONL flow -> demo locally
3. Add User Story 2 -> validate eval comparisons and summary -> demo locally
4. Add User Story 3 -> validate help/config output and `.env` precedence -> demo locally
5. Finish polish and documentation without rewriting earlier tests

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 prediction flow
   - Developer B: User Story 2 evaluation flow
   - Developer C: User Story 3 help/model catalog flow
3. Rejoin for polish, coverage hardening, and quickstart validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to a specific user story for traceability
- Each user story remains independently completable and testable
- Verify new tests fail before implementing
- Do not modify pre-existing tests unless the spec documents a required reason
- Ensure CI coverage gate stays at or above 95%, targeting 100% for changed areas
- Keep feature work in dedicated worktrees under `tmp/`
- Keep implementation MCP-free
- Keep runtime on Node.js LTS and NestJS LTS
- Prefer official Node/NestJS modules and document third-party exceptions
- Commit after each task or logical group
