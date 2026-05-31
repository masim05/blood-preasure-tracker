# Tasks: Implement According To Repo Guides

**Input**: Design documents from `/specs/014-implement-repo-guides/`

**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Test tasks are REQUIRED. This feature adds/extends contract tests for worktree and Speckit branch naming guards, command profile alignment, and guide-sync enforcement.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish guide-compliance scaffolding shared by all stories.

- [X] T001 Create guide rule scaffold in `src/test-support/guide-rules.ts`
- [X] T002 [P] Create guide compliance engine scaffold in `src/test-support/guide-compliance.ts`
- [X] T003 [P] Create guide docs contract test scaffold in `src/guide-docs.contract.test.ts`
- [X] T004 Confirm contract scope and examples in `specs/014-implement-repo-guides/contracts/guide-compliance-contract.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared parsing and validation primitives that every story depends on.

**⚠️ CRITICAL**: No user story implementation starts before this phase is complete.

- [X] T005 Implement guide source parser for `README.md` and `CONTRIBUTING.md` in `src/test-support/guide-rules.ts`
- [X] T006 [P] Implement Git metadata readers (worktree, branch, detached HEAD) in `src/test-support/guide-compliance.ts`
- [X] T007 [P] Implement validation profile reader for `package.json` scripts in `src/test-support/guide-compliance.ts`
- [X] T008 Implement remediation message formatter in `src/test-support/guide-compliance.ts`

**Checkpoint**: Shared parser and validation primitives are complete.

---

## Phase 3: User Story 1 - Enforce Contributor Workflow Guards (Priority: P1) 🎯 MVP

**Goal**: Enforce dedicated worktree usage and Speckit branch naming with actionable failures.

**Independent Test**: Run contract checks with compliant/non-compliant worktree and branch contexts and verify deterministic failures.

### Tests for User Story 1 (REQUIRED)

- [X] T009 [P] [US1] Add worktree policy contract tests in `src/test-workflow.contract.test.ts`
- [X] T010 [P] [US1] Add Speckit branch naming contract tests in `src/test-workflow.contract.test.ts`
- [X] T011 [P] [US1] Add detached HEAD handling tests in `src/test-workflow.contract.test.ts`
- [X] T012 [US1] Add helper unit tests for git metadata parsing in `src/test-support/guide-compliance.test.ts`

### Implementation for User Story 1

- [X] T013 [US1] Implement worktree guard evaluation in `src/test-support/guide-compliance.ts`
- [X] T014 [US1] Implement Speckit branch naming evaluation in `src/test-support/guide-compliance.ts`
- [X] T015 [US1] Implement detached HEAD fail-safe behavior in `src/test-support/guide-compliance.ts`
- [X] T016 [US1] Wire workflow guard checks into `src/test-workflow.contract.test.ts`

**Checkpoint**: Workflow guards are enforced for worktree, branch naming, and detached HEAD contexts.

---

## Phase 4: User Story 2 - Standardize Required Validation Commands (Priority: P2)

**Goal**: Define and enforce one canonical pre-PR validation profile.

**Independent Test**: Execute contract checks for required command profile and verify docs specify the same sequence.

### Tests for User Story 2 (REQUIRED)

- [X] T017 [P] [US2] Add command profile contract tests for `build`, `lint`, and `test:coverage` in `src/test-workflow.contract.test.ts`
- [X] T018 [P] [US2] Add docs/profile sync contract tests in `src/guide-docs.contract.test.ts`
- [X] T019 [US2] Add validation profile unit tests in `src/test-support/guide-compliance.test.ts`

### Implementation for User Story 2

- [X] T020 [US2] Implement canonical validation profile mapping in `src/test-support/guide-compliance.ts`
- [X] T021 [US2] Align validation workflow text in `README.md`
- [X] T022 [US2] Align validation workflow text in `CONTRIBUTING.md`
- [X] T023 [US2] Align quickstart validation sequence in `specs/014-implement-repo-guides/quickstart.md`

**Checkpoint**: Canonical validation commands are documented and contract-enforced.

---

## Phase 5: User Story 3 - Keep Guide Documentation And Enforcement In Sync (Priority: P3)

**Goal**: Detect and prevent drift between guide text and enforcement logic.

**Independent Test**: Change guide policy text locally and verify sync checks fail until rule mapping is updated.

### Tests for User Story 3 (REQUIRED)

- [X] T024 [P] [US3] Add guide-to-rule mapping sync tests in `src/guide-docs.contract.test.ts`
- [X] T025 [P] [US3] Add stale/unmapped rule detection tests in `src/guide-docs.contract.test.ts`
- [X] T026 [US3] Add `GuideSyncSnapshot` structure tests in `src/test-support/guide-rules.test.ts`

### Implementation for User Story 3

- [X] T027 [US3] Implement guide sync snapshot generation in `src/test-support/guide-rules.ts`
- [X] T028 [US3] Implement unmapped/stale rule detection in `src/test-support/guide-compliance.ts`
- [X] T029 [US3] Finalize contract wording and examples in `specs/014-implement-repo-guides/contracts/guide-compliance-contract.md`
- [X] T030 [US3] Add maintainer guide-sync notes in `README.md`

**Checkpoint**: Documentation/enforcement drift is automatically detected with remediation guidance.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final quality gates and measurable outcome verification.

- [X] T031 [P] Add baseline guard tests for Node and Nest versions in `src/test-workflow.contract.test.ts`
- [X] T032 [P] Add dependency-policy guard tests for new third-party additions in `src/guide-docs.contract.test.ts`
- [X] T033 [P] Add guide-check runtime threshold assertion (<30s) in `src/test-support/guide-compliance.test.ts`
- [X] T034 Run targeted contract suites in `src/test-workflow.contract.test.ts` and `src/guide-docs.contract.test.ts`
- [X] T035 Run full validation profile (`npm run build`, `npm run lint`, `npm run test:coverage`) and record results in `specs/014-implement-repo-guides/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2; delivers MVP.
- **Phase 4 (US2)**: Depends on Phase 2 and can proceed after US1 starts.
- **Phase 5 (US3)**: Depends on Phase 2 and can proceed after US1 starts.
- **Phase 6 (Polish)**: Depends on completion of selected user stories.

### User Story Dependencies

- **US1 (P1)**: First deliverable; no dependency on other stories.
- **US2 (P2)**: Uses shared foundational helpers; independent of US3.
- **US3 (P3)**: Uses shared foundational helpers; independent of US2.

### Within Each User Story

- Tests first (write and confirm fail before implementation).
- Implement helper/rule logic next.
- Wire contract tests and docs alignment last.
- Re-run focused contracts before moving forward.

### Parallel Opportunities

- Setup: `T002`, `T003`.
- Foundational: `T006`, `T007`.
- US1 tests: `T009`, `T010`, `T011`.
- US2 tests: `T017`, `T018`.
- US3 tests: `T024`, `T025`.
- Polish checks: `T031`, `T032`, `T033`.

---

## Parallel Example: User Story 1

```bash
# Contract tests in parallel:
Task T009 in src/test-workflow.contract.test.ts
Task T010 in src/test-workflow.contract.test.ts
Task T011 in src/test-workflow.contract.test.ts

# Then guard implementation:
Task T013 in src/test-support/guide-compliance.ts
Task T014 in src/test-support/guide-compliance.ts
Task T015 in src/test-support/guide-compliance.ts
```

## Parallel Example: User Story 2

```bash
# Contract and docs sync checks in parallel:
Task T017 in src/test-workflow.contract.test.ts
Task T018 in src/guide-docs.contract.test.ts

# Documentation alignment in parallel:
Task T021 in README.md
Task T022 in CONTRIBUTING.md
Task T023 in specs/014-implement-repo-guides/quickstart.md
```

## Parallel Example: User Story 3

```bash
# Drift detection tests in parallel:
Task T024 in src/guide-docs.contract.test.ts
Task T026 in src/test-support/guide-rules.test.ts

# Drift detection implementation:
Task T027 in src/test-support/guide-rules.ts
Task T028 in src/test-support/guide-compliance.ts
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Setup and Foundational phases.
2. Complete US1 tasks.
3. Validate with focused workflow contract tests.
4. Review and demo MVP behavior.

### Incremental Delivery

1. Foundation first.
2. Deliver US1 guard enforcement.
3. Deliver US2 canonical validation profile alignment.
4. Deliver US3 drift detection.
5. Complete cross-cutting polish and validation.

### Parallel Team Strategy

1. Team completes Phase 1 and Phase 2 together.
2. Developer A drives US1.
3. Developer B drives US2.
4. Developer C drives US3.
5. Team converges for Phase 6 validation.

---

## Notes

- All tasks follow strict checklist format with Task ID, optional `[P]`, optional `[US#]`, and explicit file paths.
- Story labels are used only in story phases.
- The feature stays scoped to guide enforcement and documentation alignment; runtime API/CLI/Android behavior is unchanged.
- Keep implementation MCP-free and within dedicated `tmp/` worktree policy.
- Maintain CI coverage gate `>= 95%` while targeting 100% for changed guide-compliance areas.