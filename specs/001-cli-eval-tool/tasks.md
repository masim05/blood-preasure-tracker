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

**Purpose**: Project initialization and basic toolchain structure

- [ ] T000 Verify the active feature worktree path is `tmp/001-add-cli-eval` and document the active branch/worktree before implementation
- [ ] T001 Initialize Node.js/NestJS CLI project metadata and scripts in `package.json`
- [ ] T002 Configure TypeScript compiler and Node 22 target in `tsconfig.json`
- [ ] T003 [P] Configure Jest coverage thresholds >=95% in `jest.config.ts`
- [ ] T004 [P] Add linting and formatting configuration in `eslint.config.js` and `.prettierrc`
- [ ] T005 Create baseline source/test directory structure with placeholder index files in `src/` and `tests/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Implement Nest standalone bootstrap in `src/main.ts`
- [ ] T007 [P] Wire dependency injection and adapter providers in `src/app.module.ts`
- [ ] T008 [P] Implement runtime configuration loading in `src/infrastructure/config/env-config.ts`
- [ ] T009 Implement CLI configuration resolution in `src/infrastructure/config/cli-config.ts`
- [ ] T010 [P] Define core application ports in `src/application/ports/llm-provider.port.ts`
- [ ] T011 [P] Define core application ports in `src/application/ports/image-source.port.ts`
- [ ] T012 [P] Define core application ports in `src/application/ports/output-writer.port.ts`
- [ ] T013 [P] Define evaluation/model catalog ports in `src/application/ports/evaluation-dataset.port.ts` and `src/application/ports/model-catalog.port.ts`
- [ ] T014 [P] Implement shared domain entity in `src/domain/entities/predicted-reading.ts`
- [ ] T015 [P] Implement shared domain policy in `src/domain/services/uncertainty-policy.ts`
- [ ] T016 Implement CLI argument parsing foundation in `src/adapters/inbound/cli/cli-parser.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Predict Blood Pressure Readings (Priority: P1) 🎯 MVP

**Goal**: Process a directory of monitor images and emit one JSONL prediction record per image with explicit uncertainty handling.

**Independent Test**: Run `npm run cli -- predict` against sample images and confirm one JSONL prediction per image with `status`, `uncertainFields`, selected provider/model, and actionable errors.

### Tests for User Story 1 (REQUIRED) ⚠️

> **NOTE: These tests are mandatory. Write them first and ensure they fail before implementation.**

- [ ] T017 [P] [US1] Add provider contract tests in `tests/contract/llm-provider.contract.test.ts`
- [ ] T018 [P] [US1] Add prediction use-case tests in `tests/unit/application/predict-images.use-case.test.ts`
- [ ] T019 [P] [US1] Add uncertainty policy tests in `tests/unit/domain/uncertainty-policy.test.ts`
- [ ] T020 [P] [US1] Add predict CLI integration tests in `tests/integration/cli.integration.test.ts`

### Implementation for User Story 1

- [ ] T021 [P] [US1] Implement image source adapter in `src/adapters/outbound/filesystem/image-directory.adapter.ts`
- [ ] T022 [P] [US1] Implement OpenAI vision adapter in `src/adapters/outbound/llm/openai-vision.adapter.ts`
- [ ] T023 [P] [US1] Implement JSONL prediction writer in `src/adapters/inbound/cli/jsonl-output.writer.ts`
- [ ] T024 [P] [US1] Implement model registry for default provider/model selection in `src/adapters/outbound/llm/model-registry.ts`
- [ ] T025 [US1] Implement prediction use case in `src/application/use-cases/predict-images.use-case.ts`
- [ ] T026 [US1] Integrate `predict` command flow in `src/main.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Evaluate Predictions Against Ground Truth (Priority: P2)

**Goal**: Compare predicted readings against CSV ground truth matched by filename stem and emit per-image comparison records plus a summary record.

**Independent Test**: Run `npm run cli -- eval` with sample images and `data/eval/a.csv` and confirm deterministic filename-stem matching, comparison output, unmatched handling, and final aggregate summary.

### Tests for User Story 2 (REQUIRED) ⚠️

> **NOTE: These tests are mandatory for new feature behavior.**

- [ ] T027 [P] [US2] Add evaluation matcher tests in `tests/unit/domain/evaluation-matcher.test.ts`
- [ ] T028 [P] [US2] Add evaluation use-case tests in `tests/unit/application/evaluate-images.use-case.test.ts`
- [ ] T029 [P] [US2] Add CSV dataset adapter tests in `tests/unit/adapters/csv-dataset.adapter.test.ts`
- [ ] T029a [P] [US2] Add duplicate imageId and duplicate filename-stem validation tests in `tests/unit/adapters/csv-dataset.adapter.test.ts` and `tests/unit/domain/evaluation-matcher.test.ts`
- [ ] T030 [P] [US2] Extend CLI integration tests for `eval` mode in `tests/integration/cli.integration.test.ts`

### Implementation for User Story 2

- [ ] T031 [P] [US2] Implement ground-truth entity in `src/domain/entities/ground-truth-record.ts`
- [ ] T032 [P] [US2] Implement evaluation report entity in `src/domain/entities/evaluation-report.ts`
- [ ] T033 [P] [US2] Implement filename-stem matching domain service in `src/domain/services/evaluation-matcher.ts`
- [ ] T034 [P] [US2] Implement CSV dataset adapter in `src/adapters/outbound/filesystem/csv-dataset.adapter.ts`
- [ ] T034a [US2] Enforce duplicate filename-stem validation in `src/adapters/outbound/filesystem/csv-dataset.adapter.ts` and `src/domain/services/evaluation-matcher.ts`
- [ ] T035 [US2] Implement evaluation use case in `src/application/use-cases/evaluate-images.use-case.ts`
- [ ] T036 [US2] Extend JSONL writer for comparison and summary records in `src/adapters/inbound/cli/jsonl-output.writer.ts`
- [ ] T037 [US2] Integrate `eval` command flow in `src/main.ts`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Configure Provider, Model, and Help Output (Priority: P3)

**Goal**: Expose provider/model selection and help output that lists statically configured models from installed adapters.

**Independent Test**: Run help output and non-default provider/model selections to confirm configuration precedence, available-model listing, and adapter-based routing without changing the CLI contract.

### Tests for User Story 3 (REQUIRED) ⚠️

> **NOTE: These tests are mandatory for new feature behavior.**

- [ ] T038 [P] [US3] Add model registry tests for static adapter model catalogs in `tests/unit/adapters/model-registry.test.ts`
- [ ] T039 [P] [US3] Add help renderer tests that forbid live model discovery in `tests/unit/adapters/help-renderer.test.ts`
- [ ] T040 [P] [US3] Extend CLI integration tests for help, model selection, and CLI-argument-over-environment precedence in `tests/integration/cli.integration.test.ts`

### Implementation for User Story 3

- [ ] T041 [P] [US3] Implement provider model catalog entity behavior in `src/adapters/outbound/llm/model-registry.ts`
- [ ] T042 [P] [US3] Implement help renderer in `src/adapters/inbound/cli/help-renderer.ts`
- [ ] T043 [P] [US3] Implement list-models use case in `src/application/use-cases/list-models.use-case.ts`
- [ ] T044 [US3] Extend CLI parser for provider/model/help options and CLI-argument-over-environment precedence in `src/adapters/inbound/cli/cli-parser.ts`
- [ ] T045 [US3] Integrate help and static model catalog output in `src/main.ts`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T046 [P] Document CLI usage and dataset expectations in `README.md`
- [ ] T047 Update environment examples and defaults in `.env.example`
- [ ] T048 [P] Add end-to-end fixture dataset notes in `specs/001-cli-eval-tool/quickstart.md`
- [ ] T049 Run coverage hardening and close remaining gaps in `tests/`
- [ ] T050 Run quickstart validation and record final command set in `specs/001-cli-eval-tool/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel if staffed, though US2 reuses US1 prediction flow and US3 reuses registry/parser wiring
  - Sequential priority remains P1 -> P2 -> P3 for safest delivery
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - establishes the core prediction path
- **User Story 2 (P2)**: Can start after Foundational (Phase 2), but practically depends on US1 prediction pipeline for eval comparisons
- **User Story 3 (P3)**: Can start after Foundational (Phase 2), but benefits from US1 adapter/model wiring already existing

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Ports/entities before use cases
- Use cases before CLI integration
- Core implementation before cross-command refinement
- Story complete before moving to next priority for MVP delivery

### Parallel Opportunities

- Setup tasks marked [P] can run in parallel
- Foundational port/entity tasks marked [P] can run in parallel
- In US1, contract tests, use-case tests, uncertainty tests, adapter implementations, and registry work can run in parallel across separate files
- In US2, matcher tests, CSV adapter tests, entities, and domain service work can run in parallel
- In US3, help renderer, registry, and list-models work can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch US1 tests together:
Task: "Add provider contract tests in tests/contract/llm-provider.contract.test.ts"
Task: "Add prediction use-case tests in tests/unit/application/predict-images.use-case.test.ts"
Task: "Add uncertainty policy tests in tests/unit/domain/uncertainty-policy.test.ts"

# Launch US1 adapter/entity work together:
Task: "Implement image source adapter in src/adapters/outbound/filesystem/image-directory.adapter.ts"
Task: "Implement OpenAI vision adapter in src/adapters/outbound/llm/openai-vision.adapter.ts"
Task: "Implement model registry for default provider/model selection in src/adapters/outbound/llm/model-registry.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test `npm run cli -- predict` independently
5. Demo prediction output and uncertainty contract before adding eval/help features

### Incremental Delivery

1. Complete Setup + Foundational -> foundation ready
2. Add User Story 1 -> validate prediction JSONL flow -> deploy/demo locally
3. Add User Story 2 -> validate eval comparisons and summary -> deploy/demo locally
4. Add User Story 3 -> validate help/model catalog and configuration precedence -> deploy/demo locally
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
