# Tasks: Fix Time Extraction

**Input**: Design documents from `/specs/003-fix-time-extraction/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are REQUIRED. Every user story includes new tests, preserves existing tests unless justified by the timestamp-source defect, and maintains CI coverage >= 95%.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths below follow the existing single-project CLI structure from plan.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the current provider-backed CLI for embedded metadata timestamp extraction

- [ ] T001 Add `exif-parser` and its TypeScript type handling to `package.json` and `package-lock.json`
- [ ] T002 [P] Add timestamp fixture guidance for metadata-bearing and metadata-missing images in `tests/fixtures/README.md`
- [ ] T003 [P] Add the reproducible metadata timestamp fixture `tests/fixtures/images/2026-05-19 06-05-20.JPG`
- [ ] T004 [P] Verify agent context points to `specs/003-fix-time-extraction/plan.md` in `.github/copilot-instructions.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define shared contracts and timestamp policy before any user story implementation

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Define `ImageMetadataPort`, `TimestampExtractionResult`, and supported timestamp tag types in `src/application/ports/image-metadata.port.ts`
- [ ] T006 Refactor `LlmProviderResponse` to remove provider-owned `time` in `src/application/ports/llm-provider.port.ts`
- [ ] T007 [P] Add timestamp normalization and precedence helpers in `src/domain/services/metadata-timestamp-policy.ts`
- [ ] T008 [P] Update reading uncertainty policy inputs to keep `time` uncertainty domain-owned in `src/domain/services/uncertainty-policy.ts`
- [ ] T009 Update dependency wiring for the metadata port token in `src/app.module.ts` and `src/main.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in priority order

---

## Phase 3: User Story 1 - Read EXIF DateTime in Predict Output (Priority: P1) MVP

**Goal**: `predict` emits `2026-05-19 06:05:20` for a JPEG whose embedded metadata contains `2026:05:19 06:05:20`, while vitals remain provider-derived.

**Independent Test**: Run `npm run cli -- predict --input ./data/eval` against the metadata-bearing fixture and verify the JSONL prediction for `2026-05-19 06-05-20.JPG` has non-null `time` and no `time` uncertainty.

### Tests for User Story 1 (REQUIRED)

> **NOTE: These tests are mandatory. Write them first and ensure they fail before implementation.**

- [ ] T010 [P] [US1] Add metadata port contract tests for successful `DateTime` extraction in `tests/contract/image-metadata.port.contract.test.ts`
- [ ] T011 [P] [US1] Add timestamp policy tests for `DateTimeOriginal`, `CreateDate`, `DateTime` precedence and `YYYY-MM-DD HH:mm:ss` normalization in `tests/unit/domain/metadata-timestamp-policy.test.ts`
- [ ] T012 [P] [US1] Add filesystem metadata adapter tests for the Samsung-style generic `DateTime` fixture in `tests/unit/adapters/image-metadata.adapter.test.ts`
- [ ] T013 [P] [US1] Update OpenAI adapter tests to prove provider responses no longer include `time` in `tests/unit/adapters/openai-vision.adapter.test.ts`
- [ ] T014 [P] [US1] Update predict use-case tests for metadata-derived `time` merged with provider-derived vitals in `tests/unit/application/predict-images.use-case.test.ts`
- [ ] T015 [US1] Add predict CLI integration coverage for the provided metadata-bearing JPEG in `tests/integration/cli.integration.test.ts`

### Implementation for User Story 1

- [ ] T016 [P] [US1] Implement timestamp precedence and normalization in `src/domain/services/metadata-timestamp-policy.ts`
- [ ] T017 [P] [US1] Implement the filesystem EXIF metadata adapter in `src/adapters/outbound/filesystem/image-metadata.adapter.ts`
- [ ] T018 [P] [US1] Refactor the OpenAI vision adapter to omit `time` from provider output in `src/adapters/outbound/llm/openai-vision.adapter.ts`
- [ ] T019 [US1] Update predict orchestration to call `ImageMetadataPort` and merge metadata `time` with provider vitals in `src/application/use-cases/predict-images.use-case.ts`
- [ ] T020 [US1] Register the metadata adapter in the predict runtime path in `src/app.module.ts` and `src/main.ts`

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - Preserve Null for Truly Missing Metadata (Priority: P2)

**Goal**: Images without usable embedded timestamps still emit `time: null`, mark `time` uncertain for non-error records, and never fall back to provider output, filename text, or file modification time.

**Independent Test**: Run `predict` against a fixture without supported timestamp metadata and verify `time` is null, `uncertainFields` includes `time`, and the batch continues.

### Tests for User Story 2 (REQUIRED)

> **NOTE: These tests are mandatory for new feature behavior.**

- [ ] T021 [P] [US2] Add metadata adapter tests for missing, malformed, unreadable, and unsupported timestamp metadata in `tests/unit/adapters/image-metadata.adapter.test.ts`
- [ ] T022 [P] [US2] Add timestamp policy tests rejecting malformed timestamps and timezone invention in `tests/unit/domain/metadata-timestamp-policy.test.ts`
- [ ] T023 [P] [US2] Update predicted reading and uncertainty tests for `time` uncertainty when metadata is null in `tests/unit/domain/predicted-reading.test.ts` and `tests/unit/domain/uncertainty-policy.test.ts`
- [ ] T024 [P] [US2] Update predict use-case tests to reject provider, filename, and file modification time fallback in `tests/unit/application/predict-images.use-case.test.ts`
- [ ] T025 [US2] Add predict CLI integration coverage for metadata-missing continuation in `tests/integration/cli.integration.test.ts`

### Implementation for User Story 2

- [ ] T026 [P] [US2] Extend metadata adapter issue reporting for missing, malformed, unreadable, and unsupported timestamps in `src/adapters/outbound/filesystem/image-metadata.adapter.ts`
- [ ] T027 [P] [US2] Extend timestamp policy malformed-input handling in `src/domain/services/metadata-timestamp-policy.ts`
- [ ] T028 [US2] Update predicted reading construction to include `time` uncertainty for non-error null metadata in `src/application/use-cases/predict-images.use-case.ts`
- [ ] T029 [P] [US2] Add JSONL writer tests for null metadata time and `time` uncertainty in `tests/unit/adapters/jsonl-output.writer.test.ts`
- [ ] T030 [US2] Update JSONL prediction serialization for null metadata time and `time` uncertainty in `src/adapters/inbound/cli/jsonl-output.writer.ts`

**Checkpoint**: User Stories 1 and 2 both work independently for metadata-present and metadata-missing predict flows

---

## Phase 5: User Story 3 - Use Fixed Metadata Time in Evaluation (Priority: P3)

**Goal**: `eval` compares CSV ground-truth timestamps against the corrected metadata-derived prediction timestamp.

**Independent Test**: Run `npm run cli -- eval --input ./data/eval --csv ./data/eval/a.csv` with a CSV row expecting `2026-05-19 06:05:20` and verify the timestamp comparison matches.

### Tests for User Story 3 (REQUIRED)

> **NOTE: These tests are mandatory for new feature behavior.**

- [ ] T031 [P] [US3] Update evaluation use-case tests to use metadata-derived prediction timestamps in `tests/unit/application/evaluate-images.use-case.test.ts`
- [ ] T032 [P] [US3] Update evaluation matcher tests for normalized timestamp matches and null timestamp mismatches in `tests/unit/domain/evaluation-matcher.test.ts`
- [ ] T033 [P] [US3] Add eval CLI integration coverage for a CSV row matching the embedded metadata timestamp in `tests/integration/cli.integration.test.ts`

### Implementation for User Story 3

- [ ] T034 [US3] Update eval orchestration to call `ImageMetadataPort` and merge metadata `time` before comparison in `src/application/use-cases/evaluate-images.use-case.ts`
- [ ] T035 [P] [US3] Update evaluation matcher timestamp comparison behavior for normalized metadata time in `src/domain/services/evaluation-matcher.ts`
- [ ] T036 [US3] Register the metadata adapter in the eval runtime path in `src/app.module.ts` and `src/main.ts`

**Checkpoint**: All user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and coverage hardening across all stories

- [ ] T037 [P] Update README timestamp behavior and validation notes in `README.md`
- [ ] T038 [P] Refresh bug-fix quickstart validation notes in `specs/003-fix-time-extraction/quickstart.md`
- [ ] T039 [P] Update CLI contract examples after implementation details settle in `specs/003-fix-time-extraction/contracts/cli.md`
- [ ] T040 Run focused build and test validation with `npm run build`, `npm test`, and `npm run test:coverage`
- [ ] T041 Run quickstart predict/eval validation commands from `specs/003-fix-time-extraction/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - Sequential priority remains P1 -> P2 -> P3 for safest delivery
  - Stories can be parallelized after foundations if staffed, but US2/US3 should reuse the policy and adapter behavior proven by US1
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - establishes metadata timestamp extraction and provider/metadata merge
- **User Story 2 (P2)**: Can start after Foundational, but benefits from US1 adapter and timestamp policy implementation
- **User Story 3 (P3)**: Can start after Foundational, but depends on the metadata-backed prediction shape from US1

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Port and policy before adapters
- Adapters before use-case orchestration
- Use cases before CLI integration validation
- Story complete before moving to the next priority for MVP delivery

### Parallel Opportunities

- Setup tasks marked [P] can run in parallel
- Foundational policy/uncertainty tasks marked [P] can run in parallel after dependency setup
- In US1, metadata port contract, timestamp policy, adapter, provider adapter, and use-case tests can be authored in parallel across separate files
- In US2, adapter malformed-input tests, policy rejection tests, domain uncertainty tests, and use-case fallback tests can be authored in parallel
- In US3, use-case tests, matcher tests, and CLI integration tests can be authored in parallel
- Polish documentation tasks marked [P] can run in parallel after behavior stabilizes

---

## Parallel Example: User Story 1

```bash
# Launch US1 tests together:
Task: "Add metadata port contract tests for successful DateTime extraction in tests/contract/image-metadata.port.contract.test.ts"
Task: "Add timestamp policy tests for DateTimeOriginal, CreateDate, DateTime precedence and YYYY-MM-DD HH:mm:ss normalization in tests/unit/domain/metadata-timestamp-policy.test.ts"
Task: "Add filesystem metadata adapter tests for the Samsung-style generic DateTime fixture in tests/unit/adapters/image-metadata.adapter.test.ts"
Task: "Update OpenAI adapter tests to prove provider responses no longer include time in tests/unit/adapters/openai-vision.adapter.test.ts"

# Launch US1 implementation work together after tests fail:
Task: "Implement timestamp precedence and normalization in src/domain/services/metadata-timestamp-policy.ts"
Task: "Implement the filesystem EXIF metadata adapter in src/adapters/outbound/filesystem/image-metadata.adapter.ts"
Task: "Refactor the OpenAI vision adapter to omit time from provider output in src/adapters/outbound/llm/openai-vision.adapter.ts"
```

## Parallel Example: User Story 2

```bash
# Launch US2 tests together:
Task: "Add metadata adapter tests for missing, malformed, unreadable, and unsupported timestamp metadata in tests/unit/adapters/image-metadata.adapter.test.ts"
Task: "Add timestamp policy tests rejecting malformed timestamps and timezone invention in tests/unit/domain/metadata-timestamp-policy.test.ts"
Task: "Update predicted reading and uncertainty tests for time uncertainty when metadata is null in tests/unit/domain/predicted-reading.test.ts and tests/unit/domain/uncertainty-policy.test.ts"
Task: "Update predict use-case tests to reject provider, filename, and file modification time fallback in tests/unit/application/predict-images.use-case.test.ts"
```

## Parallel Example: User Story 3

```bash
# Launch US3 tests together:
Task: "Update evaluation use-case tests to use metadata-derived prediction timestamps in tests/unit/application/evaluate-images.use-case.test.ts"
Task: "Update evaluation matcher tests for normalized timestamp matches and null timestamp mismatches in tests/unit/domain/evaluation-matcher.test.ts"
Task: "Add eval CLI integration coverage for a CSV row matching the embedded metadata timestamp in tests/integration/cli.integration.test.ts"

# Launch US3 implementation work after tests fail:
Task: "Update evaluation matcher timestamp comparison behavior for normalized metadata time in src/domain/services/evaluation-matcher.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. STOP and VALIDATE: Run `npm run cli -- predict --input ./data/eval` and confirm the provided JPEG emits `time: "2026-05-19 06:05:20"`
5. Demo the fixed predict output before extending missing-metadata and eval behavior

### Incremental Delivery

1. Complete Setup + Foundational -> metadata port and timestamp policy ready
2. Add User Story 1 -> predict reads embedded EXIF/TIFF `DateTime`
3. Add User Story 2 -> missing/malformed metadata remains null and uncertain without fallbacks
4. Add User Story 3 -> eval compares against metadata-derived normalized time
5. Finish documentation, coverage, and quickstart validation

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 predict timestamp extraction
   - Developer B: US2 null/uncertainty and fallback prevention
   - Developer C: US3 evaluation comparison flow
3. Rejoin for runtime wiring, documentation, coverage, and quickstart validation

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to a user story for traceability
- Each user story should be independently completable and testable
- Verify new tests fail before implementing
- Preserve existing tests unless changing provider-owned timestamp behavior is required by this defect fix
- Keep CI coverage at or above 95%, targeting full coverage for changed timestamp branches
- Keep implementation MCP-free in the dedicated `tmp/` worktree
