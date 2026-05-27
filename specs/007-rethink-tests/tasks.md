# Tasks: Rethink Tests

**Input**: Design documents from `/specs/007-rethink-tests/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: New workflow contract tests are required for npm script selection and CI orchestration. No product behavior assertions are added or changed. Existing test assertions MUST NOT be changed logically; final validation is performed by running the revised commands from quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each workflow slice.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Project config: `package.json`, `jest.config.ts`, `.github/workflows/ci.yml`
- Colocated unit/contract tests: `src/**/*.test.ts`
- New workflow contract tests: `src/test-workflow.contract.test.ts`
- Integration tests: `tests/integration/**/*.test.ts`
- Integration assets/dependencies: `tests/fixtures/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the current command, CI, and test layout before changing behavior.

- [ ] T001 Review command requirements in specs/007-rethink-tests/contracts/npm-scripts.md
- [ ] T002 [P] Review CI job requirements in specs/007-rethink-tests/contracts/ci-workflow.md
- [ ] T003 [P] Inspect existing npm scripts in package.json
- [ ] T004 [P] Inspect current Jest discovery and coverage settings in jest.config.ts
- [ ] T005 [P] Inspect current CI workflow structure in .github/workflows/ci.yml
- [ ] T006 Confirm implementation is running from the dedicated tmp/007-rethink-tests worktree before editing package.json, jest.config.ts, or .github/workflows/ci.yml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish test-suite selection rules that all user stories depend on.

**CRITICAL**: No user story work should begin until this phase is complete.

- [ ] T007 Define unit/contract test selection as `src/**/*.test.ts` in package.json script commands
- [ ] T008 Define integration test selection as `tests/integration/**/*.test.ts` in package.json script commands
- [ ] T009 Ensure coverage collection remains limited to production source files in jest.config.ts
- [ ] T010 Confirm integration fixtures and dependencies remain available under tests/fixtures/ and tests/integration/
- [ ] T011 Create failing workflow contract tests for npm script selection and CI job structure in src/test-workflow.contract.test.ts

**Checkpoint**: Test-suite categories are explicit and ready for story implementation.

---

## Phase 3: User Story 1 - Run Fast Verification Locally (Priority: P1) MVP

**Goal**: Make local fast test and coverage commands execute only unit and contract suites.

**Independent Test**: Run `npm test` and `npm run test:coverage`; both should execute colocated `src/**/*.test.ts` suites and exclude `tests/integration/**/*.test.ts`.

### Implementation for User Story 1

- [ ] T012 [US1] Add workflow contract assertions for `test` and `test:coverage` unit/contract-only script selection in src/test-workflow.contract.test.ts
- [ ] T013 [US1] Update `test` script to run unit/contract suites only in package.json
- [ ] T014 [US1] Update `test:coverage` script to run unit/contract suites only while preserving coverage in package.json
- [ ] T015 [US1] Adjust Jest roots or path handling as needed for unit/contract command selection in jest.config.ts
- [ ] T016 [US1] Run `npm test` from package.json and verify output includes 0 integration suites for package.json script behavior
- [ ] T017 [US1] Run `npm run test:coverage` from package.json and verify output includes 0 integration suites while preserving the >=95% coverage gate

**Checkpoint**: User Story 1 is independently functional; local fast and coverage commands exclude integration tests.

---

## Phase 4: User Story 2 - Run Integration Tests Explicitly (Priority: P2)

**Goal**: Add a dedicated command that runs integration tests only.

**Independent Test**: Run `npm run test:integration`; it should execute every suite under `tests/integration/**/*.test.ts` and no colocated `src/**/*.test.ts` suites.

### Implementation for User Story 2

- [ ] T018 [US2] Add workflow contract assertions for `test:integration` integration-only script selection in src/test-workflow.contract.test.ts
- [ ] T019 [US2] Add `test:integration` npm script for `tests/integration/**/*.test.ts` suites in package.json
- [ ] T020 [US2] Adjust Jest roots or path handling as needed for integration command selection in jest.config.ts
- [ ] T021 [US2] Run `npm run test:integration` from package.json and verify output includes integration suites only
- [ ] T022 [US2] Run `npm test` from package.json and verify integration suites remain excluded after adding `test:integration`

**Checkpoint**: User Story 2 is independently functional; integration tests have a dedicated command.

---

## Phase 5: User Story 3 - Parallelize CI Feedback (Priority: P3)

**Goal**: Split CI into independent build, lint, unit/contract coverage, and integration test jobs.

**Independent Test**: Inspect `.github/workflows/ci.yml` and verify four independent jobs exist with no `npm test` CI job or step.

### Implementation for User Story 3

- [ ] T023 [US3] Add workflow contract assertions for four independent CI jobs and no CI `npm test` step in src/test-workflow.contract.test.ts
- [ ] T024 [US3] Replace the single serial CI job with a `build` job running `npm run build` in .github/workflows/ci.yml
- [ ] T025 [P] [US3] Add a `unit-contract-coverage` job running `npm run test:coverage` in .github/workflows/ci.yml
- [ ] T026 [P] [US3] Add an `integration-tests` job running `npm run test:integration` in .github/workflows/ci.yml
- [ ] T027 [P] [US3] Add a `lint` job running `npm run lint` in .github/workflows/ci.yml
- [ ] T028 [US3] Remove the redundant CI `npm test` step from .github/workflows/ci.yml
- [ ] T029 [US3] Verify CI jobs have no `needs` dependencies so build, lint, unit/contract coverage, and integration can run in parallel in .github/workflows/ci.yml

**Checkpoint**: User Story 3 is independently functional; CI exposes separate parallel validation jobs.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the full workflow and update contributor-facing command documentation.

- [ ] T030 [P] Update test command documentation in README.md
- [ ] T031 [P] Confirm quickstart validation steps remain accurate in specs/007-rethink-tests/quickstart.md
- [ ] T032 Run `npm run build` from package.json to verify production build remains unchanged
- [ ] T033 Run `npm test` from package.json to verify unit/contract-only fast tests and workflow contract tests pass
- [ ] T034 Run `npm run test:coverage` from package.json to verify unit/contract coverage passes the >=95% threshold
- [ ] T035 Run `npm run test:integration` from package.json to verify integration-only tests pass
- [ ] T036 Run `npm run lint` from package.json to verify configuration and YAML changes are lint-clean
- [ ] T037 Inspect `git diff -- package.json jest.config.ts .github/workflows/ci.yml README.md src/test-workflow.contract.test.ts` and confirm no product business logic or existing test assertions changed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on Setup; defines suite selection rules and creates workflow contract tests used by every story.
- **User Story 1 (Phase 3)**: Depends on Foundational; MVP for fast local verification.
- **User Story 2 (Phase 4)**: Depends on Foundational; can run after or alongside US1 once script selection is understood.
- **User Story 3 (Phase 5)**: Depends on US1 and US2 because CI jobs call the revised npm scripts.
- **Polish (Phase 6)**: Depends on selected stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Requires Phase 2; no dependency on US2 or US3.
- **User Story 2 (P2)**: Requires Phase 2; no dependency on US3, but should verify it does not regress US1 command behavior.
- **User Story 3 (P3)**: Requires US1 and US2 scripts to exist before CI can call them.

### Within Each User Story

- Update command/config files before running validation commands.
- Run the independent validation command before marking a story complete.
- Do not modify existing test assertions or product source logic.
- Preserve coverage threshold behavior before moving to CI changes.

### Parallel Opportunities

- T002, T003, T004, and T005 can run in parallel during Setup.
- T025, T026, and T027 touch separate CI jobs in one workflow file but can be drafted independently before final YAML reconciliation.
- T030 and T031 can run in parallel during Polish because README and quickstart are separate files.
- Validation commands T032 through T036 should run after implementation; they may run in parallel when local resources allow, but failures should be read independently.

---

## Parallel Example: User Story 3

```bash
# Draft independent CI job sections before reconciling the final workflow file:
Task: "Add a unit-contract-coverage job running npm run test:coverage in .github/workflows/ci.yml"
Task: "Add an integration-tests job running npm run test:integration in .github/workflows/ci.yml"
Task: "Add a lint job running npm run lint in .github/workflows/ci.yml"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational suite selection rules.
3. Complete Phase 3: User Story 1.
4. Stop and validate with `npm test` and `npm run test:coverage`.
5. Confirm both commands run unit/contract tests only and coverage still passes.

### Incremental Delivery

1. Setup + Foundational: clarify current scripts, Jest selection, and CI shape.
2. Add User Story 1: make fast and coverage commands unit/contract-only.
3. Add User Story 2: add integration-only command.
4. Add User Story 3: split CI into parallel jobs that call the revised commands.
5. Polish: update README and run all validation commands.

### Parallel Team Strategy

With multiple developers:

1. One developer updates local npm/Jest command selection for US1 and US2.
2. Another developer drafts CI job splitting after scripts are defined.
3. Documentation updates can proceed in parallel once command names are stable.

---

## Notes

- [P] tasks = different files or independently draftable work with no dependency on incomplete tasks.
- [Story] label maps task to a specific user story for traceability.
- Every story has an independent command or workflow validation path.
- Existing test assertions must not be changed logically.
- Product business logic must not be changed.
- CI coverage gate must remain at or above 95%.
- Keep implementation MCP-free and use local repository tooling only.
