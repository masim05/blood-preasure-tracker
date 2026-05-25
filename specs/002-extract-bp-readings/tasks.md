# Tasks: Provider Metadata Extraction

**Input**: Design documents from `/specs/002-extract-bp-readings/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are REQUIRED. Every user story MUST include new tests, preserve existing tests unless justified, and maintain CI coverage >= 95%.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths below follow the existing single-project CLI structure from plan.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the existing provider-backed CLI for metadata-only timestamp work

- [ ] T001 Confirm active feature docs and task target in `specs/002-extract-bp-readings/`
- [ ] T002 Update runtime and test dependencies for metadata extraction in `package.json`
- [ ] T003 [P] Refresh environment examples for provider plus metadata behavior in `.env.example`
- [ ] T004 [P] Add metadata fixture guidance in `tests/fixtures/README.md`
- [ ] T005 [P] Update agent and developer context references for feature `002` in `.github/copilot-instructions.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Define the new metadata extraction port in `src/application/ports/image-metadata.port.ts`
- [ ] T007 Refactor the provider contract to remove `time` from `src/application/ports/llm-provider.port.ts`
- [ ] T008 [P] Refactor the extracted reading entity for metadata-owned timestamps in `src/domain/entities/predicted-reading.ts`
- [ ] T009 [P] Update shared timestamp uncertainty rules in `src/domain/services/uncertainty-policy.ts`
- [ ] T010 [P] Extend CLI configuration for metadata tag policy and existing provider settings in `src/infrastructure/config/env-config.ts` and `src/infrastructure/config/cli-config.ts`
- [ ] T011 Wire the metadata adapter dependency graph in `src/app.module.ts`
- [ ] T012 Update bootstrap assembly for provider-plus-metadata orchestration in `src/main.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Predict Readings from Images (Priority: P1) 🎯 MVP

**Goal**: Keep `predict` mode provider-backed for blood pressure values while making image metadata the sole source of `time`.

**Independent Test**: Run `npm run cli -- predict` against fixture images and confirm each JSONL prediction uses provider-derived vitals, metadata-derived `time`, and uncertainty when metadata is missing.

### Tests for User Story 1 (REQUIRED) ⚠️

> **NOTE: These tests are mandatory. Write them first and ensure they fail before implementation.**

- [ ] T013 [P] [US1] Add metadata adapter contract tests in `tests/contract/image-metadata.port.contract.test.ts`
- [ ] T014 [P] [US1] Update provider adapter tests to forbid provider-owned `time` in `tests/unit/adapters/openai-vision.adapter.test.ts`
- [ ] T015 [P] [US1] Add metadata adapter unit tests in `tests/unit/adapters/image-metadata.adapter.test.ts`
- [ ] T016 [P] [US1] Update prediction use-case tests for merged provider and metadata output in `tests/unit/application/predict-images.use-case.test.ts`
- [ ] T017 [P] [US1] Extend predicted reading and uncertainty policy tests for metadata-owned `time` in `tests/unit/domain/predicted-reading.test.ts` and `tests/unit/domain/uncertainty-policy.test.ts`
- [ ] T018 [P] [US1] Add predict CLI integration coverage for metadata timestamps in `tests/integration/cli.integration.test.ts`

### Implementation for User Story 1

- [ ] T019 [P] [US1] Implement filesystem metadata extraction adapter in `src/adapters/outbound/filesystem/image-metadata.adapter.ts`
- [ ] T020 [P] [US1] Refactor the OpenAI adapter response schema in `src/adapters/outbound/llm/openai-vision.adapter.ts`
- [ ] T021 [US1] Update predict orchestration to merge provider output with metadata output in `src/application/use-cases/predict-images.use-case.ts`
- [ ] T022 [US1] Update JSONL prediction serialization for metadata source fields in `src/adapters/inbound/cli/jsonl-output.writer.ts`
- [ ] T023 [US1] Integrate metadata-backed `predict` flow in `src/main.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Evaluate Predictions Against Ground Truth (Priority: P2)

**Goal**: Keep `eval` mode working with filename-stem CSV matching while using metadata-backed timestamps in predictions and resilient per-item failure reporting.

**Independent Test**: Run `npm run cli -- eval` against a fixture image set and CSV and confirm comparison JSONL output, summary totals, metadata-missing handling, and continued processing after per-image failures.

### Tests for User Story 2 (REQUIRED) ⚠️

> **NOTE: These tests are mandatory for new feature behavior.**

- [ ] T024 [P] [US2] Update evaluation use-case tests for metadata-backed predictions in `tests/unit/application/evaluate-images.use-case.test.ts`
- [ ] T025 [P] [US2] Extend evaluation matcher tests for metadata timestamp comparisons and unmatched rows in `tests/unit/domain/evaluation-matcher.test.ts`
- [ ] T026 [P] [US2] Update CSV dataset adapter tests for eval matching invariants in `tests/unit/adapters/csv-dataset.adapter.test.ts`
- [ ] T027 [P] [US2] Extend eval CLI integration tests for metadata/provider failures in `tests/integration/cli.integration.test.ts`

### Implementation for User Story 2

- [ ] T028 [P] [US2] Update ground-truth and evaluation report entities for metadata-missing accounting in `src/domain/entities/ground-truth-record.ts` and `src/domain/entities/evaluation-report.ts`
- [ ] T029 [P] [US2] Update evaluation matcher rules for metadata-backed timestamps in `src/domain/services/evaluation-matcher.ts`
- [ ] T030 [P] [US2] Refine CSV dataset loading and duplicate-stem validation in `src/adapters/outbound/filesystem/csv-dataset.adapter.ts`
- [ ] T031 [US2] Update eval orchestration to consume metadata-backed predictions in `src/application/use-cases/evaluate-images.use-case.ts`
- [ ] T032 [US2] Extend JSONL comparison and summary output for metadata failures in `src/adapters/inbound/cli/jsonl-output.writer.ts`
- [ ] T033 [US2] Integrate metadata-aware `eval` flow in `src/main.ts`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Configure Provider Use and Metadata Rules (Priority: P3)

**Goal**: Preserve provider/model configuration and help output while clearly documenting that timestamps come only from image metadata.

**Independent Test**: Run `npm run cli -- --help` and configuration-focused tests to confirm provider/model help remains available and metadata-only timestamp behavior is explicit.

### Tests for User Story 3 (REQUIRED) ⚠️

> **NOTE: These tests are mandatory for new feature behavior.**

- [ ] T034 [P] [US3] Update CLI parser tests for predict/eval provider configuration in `tests/unit/adapters/cli-parser.test.ts`
- [ ] T035 [P] [US3] Update CLI config and env-loading tests for provider credentials and metadata settings in `tests/unit/infrastructure/cli-config.test.ts` and `tests/unit/infrastructure/env-config.test.ts`
- [ ] T036 [P] [US3] Update help renderer tests for metadata-only timestamp guidance in `tests/unit/adapters/help-renderer.test.ts`
- [ ] T037 [P] [US3] Extend help CLI integration coverage in `tests/integration/cli.integration.test.ts`

### Implementation for User Story 3

- [ ] T038 [P] [US3] Update CLI parser option handling in `src/adapters/inbound/cli/cli-parser.ts`
- [ ] T039 [P] [US3] Update help rendering and model catalog messaging in `src/adapters/inbound/cli/help-renderer.ts` and `src/adapters/outbound/llm/model-registry.ts`
- [ ] T040 [US3] Finalize configuration validation and help wiring in `src/infrastructure/config/cli-config.ts` and `src/main.ts`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T041 [P] Update README usage, environment, and help text in `README.md`
- [ ] T042 [P] Refresh quickstart validation notes in `specs/002-extract-bp-readings/quickstart.md`
- [ ] T043 [P] Update metadata and provider documentation examples in `specs/002-extract-bp-readings/contracts/cli.md` and `specs/002-extract-bp-readings/data-model.md`
- [ ] T044 Run coverage hardening for changed feature areas in `tests/`
- [ ] T045 Run quickstart and runtime validation commands in `specs/002-extract-bp-readings/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel if staffed
  - Sequential priority remains P1 → P2 → P3 for safest delivery
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - establishes provider-plus-metadata prediction flow
- **User Story 2 (P2)**: Can start after Foundational (Phase 2), but depends on the prediction output shape defined in US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2), but benefits from the updated provider and metadata boundaries established in US1

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Ports and entities before use cases
- Use cases before CLI integration
- Core behavior before documentation refinements
- Story complete before moving to next priority for MVP delivery

### Parallel Opportunities

- Setup tasks marked [P] can run in parallel
- Foundational port/entity/config tasks marked [P] can run in parallel
- In US1, metadata contract tests, provider adapter tests, metadata adapter tests, and domain tests can run in parallel across separate files
- In US2, eval use-case tests, matcher tests, dataset tests, and entity updates can run in parallel
- In US3, parser, config, and help tests can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch US1 tests together:
Task: "Add metadata adapter contract tests in tests/contract/image-metadata.port.contract.test.ts"
Task: "Update provider adapter tests to forbid provider-owned time in tests/unit/adapters/openai-vision.adapter.test.ts"
Task: "Add metadata adapter unit tests in tests/unit/adapters/image-metadata.adapter.test.ts"

# Launch US1 implementation work together:
Task: "Implement filesystem metadata extraction adapter in src/adapters/outbound/filesystem/image-metadata.adapter.ts"
Task: "Refactor the OpenAI adapter response schema in src/adapters/outbound/llm/openai-vision.adapter.ts"
Task: "Update JSONL prediction serialization for metadata source fields in src/adapters/inbound/cli/jsonl-output.writer.ts"
```

## Parallel Example: User Story 2

```bash
# Launch US2 tests together:
Task: "Update evaluation use-case tests for metadata-backed predictions in tests/unit/application/evaluate-images.use-case.test.ts"
Task: "Extend evaluation matcher tests for metadata timestamp comparisons and unmatched rows in tests/unit/domain/evaluation-matcher.test.ts"
Task: "Update CSV dataset adapter tests for eval matching invariants in tests/unit/adapters/csv-dataset.adapter.test.ts"

# Launch US2 domain work together:
Task: "Update ground-truth and evaluation report entities for metadata-missing accounting in src/domain/entities/ground-truth-record.ts and src/domain/entities/evaluation-report.ts"
Task: "Update evaluation matcher rules for metadata-backed timestamps in src/domain/services/evaluation-matcher.ts"
Task: "Refine CSV dataset loading and duplicate-stem validation in src/adapters/outbound/filesystem/csv-dataset.adapter.ts"
```

## Parallel Example: User Story 3

```bash
# Launch US3 tests together:
Task: "Update CLI parser tests for predict/eval provider configuration in tests/unit/adapters/cli-parser.test.ts"
Task: "Update CLI config and env-loading tests for provider credentials and metadata settings in tests/unit/infrastructure/cli-config.test.ts and tests/unit/infrastructure/env-config.test.ts"
Task: "Update help renderer tests for metadata-only timestamp guidance in tests/unit/adapters/help-renderer.test.ts"

# Launch US3 implementation together:
Task: "Update CLI parser option handling in src/adapters/inbound/cli/cli-parser.ts"
Task: "Update help rendering and model catalog messaging in src/adapters/inbound/cli/help-renderer.ts and src/adapters/outbound/llm/model-registry.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test `npm run cli -- predict` independently against metadata-bearing fixtures
5. Demo provider-backed prediction with metadata-only timestamps before extending eval/help flows

### Incremental Delivery

1. Complete Setup + Foundational → foundation ready
2. Add User Story 1 → test `predict` independently → demo MVP
3. Add User Story 2 → test `eval` independently → demo evaluation workflow
4. Add User Story 3 → test help/config independently → demo operator setup flow
5. Finish polish, documentation, and validation without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 prediction and metadata flow
   - Developer B: User Story 2 evaluation flow
   - Developer C: User Story 3 configuration/help flow
3. Rejoin for polish, coverage hardening, and quickstart validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify new tests fail before implementing
- Do not modify pre-existing tests unless the spec documents a required reason
- Ensure CI coverage gate stays at or above 95%, targeting 100% for changed areas
- Keep feature work in dedicated worktrees under `tmp/`
- Keep implementation MCP-free
- Keep runtime on Node.js LTS and NestJS LTS
- Prefer official Node/NestJS modules and document third-party exceptions
- Commit after each task or logical group
