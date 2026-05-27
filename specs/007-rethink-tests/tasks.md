# Tasks: Rethink Tests

**Input**: Design documents from `/specs/007-rethink-tests/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Test tasks are required because the feature changes workflow contracts and integration-test behavior. Workflow behavior is covered by `src/test-workflow.contract.test.ts`; mobile API behavior is covered by `tests/integration/mobile-api.integration.test.ts` against real PostgreSQL-backed infrastructure.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each workflow slice.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Project config: `package.json`, `jest.config.ts`, `.github/workflows/ci.yml`, `.env.test`
- Workflow contract tests: `src/test-workflow.contract.test.ts`
- Integration tests: `tests/integration/mobile-api.integration.test.ts`, `tests/integration/cli.integration.test.ts`
- OpenAPI reference: `docs/openapi.yaml`
- Feature docs: `specs/007-rethink-tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the current workflow, real infrastructure, and API contract before changing behavior.

- [ ] T001 Review command requirements in specs/007-rethink-tests/contracts/npm-scripts.md
- [ ] T002 [P] Review CI job requirements in specs/007-rethink-tests/contracts/ci-workflow.md
- [ ] T003 [P] Review integration environment requirements in specs/007-rethink-tests/contracts/integration-environment.md
- [ ] T004 [P] Inspect current npm scripts in package.json
- [ ] T005 [P] Inspect Jest discovery and coverage settings in jest.config.ts
- [ ] T006 [P] Inspect current CI workflow structure in .github/workflows/ci.yml
- [ ] T007 [P] Inspect current mobile API integration suite in tests/integration/mobile-api.integration.test.ts
- [ ] T008 [P] Inspect implemented mobile API 4xx responses in docs/openapi.yaml
- [ ] T009 Confirm implementation is running from the dedicated tmp/007-rethink-tests worktree before editing package.json, jest.config.ts, .github/workflows/ci.yml, .env.test, or tests/integration/mobile-api.integration.test.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared workflow contract tests and suite-selection decisions required before changing commands or CI.

**CRITICAL**: No user story work should begin until this phase is complete.

- [ ] T010 Create or update src/test-workflow.contract.test.ts as the workflow contract test file
- [ ] T011 Define expected unit/contract test selection and integration test selection constants in src/test-workflow.contract.test.ts
- [ ] T012 Confirm integration fixtures and dependencies remain available under tests/fixtures/ and tests/integration/

**Checkpoint**: Workflow contract tests and suite-selection expectations are ready for story implementation.

---

## Phase 3: User Story 1 - Run Fast Verification Locally (Priority: P1) MVP

**Goal**: Make local fast test and coverage commands execute only unit and contract suites.

**Independent Test**: Run `npm test` and `npm run test:coverage`; both should execute colocated `src/**/*.test.ts` suites and exclude `tests/integration/**/*.test.ts`.

### Tests for User Story 1

- [ ] T013 [P] [US1] Add failing workflow contract assertions for `test` and `test:coverage` unit/contract-only selection in src/test-workflow.contract.test.ts

### Implementation for User Story 1

- [ ] T014 [US1] Update `test` script to exclude integration suites in package.json
- [ ] T015 [US1] Update `test:coverage` script to exclude integration suites while preserving coverage in package.json
- [ ] T016 [US1] Adjust production-source coverage collection for unit/contract-only coverage in jest.config.ts
- [ ] T017 [US1] Run `npm test` and verify 0 integration suites execute for package.json
- [ ] T018 [US1] Run `npm run test:coverage` and verify 0 integration suites execute while the >=95% coverage gate passes for jest.config.ts

**Checkpoint**: User Story 1 is independently functional; local fast and coverage commands exclude integration tests without requiring real-DB integration rewiring.

---

## Phase 4: User Story 2 - Run Integration Tests Explicitly (Priority: P2)

**Goal**: Add a dedicated command that runs integration tests only, with mobile API integration tests using real database-backed infrastructure, independent endpoint scenarios, endpoint-specific names, OpenAI-only mocking, and all documented OpenAPI 4xx responses.

**Independent Test**: Run `npm run db:init -- --env .env.test` followed by `npm run test:integration`; it should execute every suite under `tests/integration/**/*.test.ts`, no colocated `src/**/*.test.ts` suites, and mobile API scenarios should be independent.

### Tests for User Story 2

- [ ] T019 [P] [US2] Add failing workflow contract assertions for `test:integration` integration-only script selection in src/test-workflow.contract.test.ts
- [ ] T020 [P] [US2] Add `.env.test` file presence and required-key assertions to src/test-workflow.contract.test.ts
- [ ] T021 [P] [US2] Add failing integration checks for `.env.test` database configuration use in tests/integration/mobile-api.integration.test.ts
- [ ] T022 [P] [US2] Add failing integration checks that endpoint-level scenarios clean database state before setup in tests/integration/mobile-api.integration.test.ts
- [ ] T023 [P] [US2] Add failing integration checks that mobile API fixture overrides only OpenAI/LLM_PROVIDER in tests/integration/mobile-api.integration.test.ts

### Implementation for User Story 2

- [ ] T024 [US2] Create tracked non-secret integration defaults in .env.test
- [ ] T025 [US2] Add `test:integration` npm script selecting tests/integration/**/*.test.ts only in package.json
- [ ] T026 [US2] Adjust Jest path handling so `npm run test:integration` excludes src/**/*.test.ts in jest.config.ts
- [ ] T027 [US2] Define integration database cleanup helper for `user_accounts`, `bearer_tokens`, `measurements`, `measurement_images`, and `recognition_tasks` in tests/integration/mobile-api.integration.test.ts
- [ ] T028 [US2] Define `.env.test` loading helper before creating the mobile API Nest fixture in tests/integration/mobile-api.integration.test.ts
- [ ] T029 [US2] Define deterministic OpenAI/LLM provider test double for recognition flows in tests/integration/mobile-api.integration.test.ts
- [ ] T030 [US2] Use real PostgreSQL repositories through ApiModule or production-equivalent providers in tests/integration/mobile-api.integration.test.ts
- [ ] T031 [US2] Use real filesystem measurement image storage under `.env.test` MEASUREMENT_IMAGE_DIR in tests/integration/mobile-api.integration.test.ts
- [ ] T032 [US2] Override only the OpenAI/LLM_PROVIDER boundary with deterministic recognition output in tests/integration/mobile-api.integration.test.ts
- [ ] T033 [US2] Remove in-memory mobile API store fixture usage from tests/integration/mobile-api.integration.test.ts
- [ ] T034 [US2] Reset relevant PostgreSQL tables before each endpoint-level describe block in tests/integration/mobile-api.integration.test.ts
- [ ] T035 [US2] Add validation proving endpoint-level scenarios start from empty relevant DB state in tests/integration/mobile-api.integration.test.ts
- [ ] T036 [US2] Rename happy-path endpoint describe blocks to `<METHOD> <path> - <scenario>` format in tests/integration/mobile-api.integration.test.ts
- [ ] T037 [US2] Replace in-memory persistence assertions with HTTP response or real database assertions in tests/integration/mobile-api.integration.test.ts
- [ ] T038 [US2] Compare implemented mobile API 4xx responses against docs/openapi.yaml before adding negative-path scenarios in tests/integration/mobile-api.integration.test.ts
- [ ] T039 [US2] Add `POST /api/v1/signin` negative scenarios for 400, 409, and 429 OpenAPI responses in tests/integration/mobile-api.integration.test.ts
- [ ] T040 [US2] Add `POST /api/v1/login` negative scenarios for 400, 401, and 429 OpenAPI responses in tests/integration/mobile-api.integration.test.ts
- [ ] T041 [US2] Add `POST /api/v1/measurements` negative scenarios for 400 and 401 OpenAPI responses in tests/integration/mobile-api.integration.test.ts
- [ ] T042 [US2] Add `GET /api/v1/measurements` negative scenarios for 400 and 401 OpenAPI responses in tests/integration/mobile-api.integration.test.ts
- [ ] T043 [US2] Add `GET /api/v1/measurements/{id}` negative scenarios for 401 and 404 OpenAPI responses in tests/integration/mobile-api.integration.test.ts
- [ ] T044 [US2] Add `POST /api/v1/measurements/{id}/save` negative scenarios for 401, 404, and 409 OpenAPI responses in tests/integration/mobile-api.integration.test.ts
- [ ] T045 [US2] Add `GET /api/v1/measurements/{id}/image` negative scenarios for 401 and 404 OpenAPI responses in tests/integration/mobile-api.integration.test.ts
- [ ] T046 [US2] Run `npm run db:init -- --env .env.test` and verify migrations prepare the database named by .env.test
- [ ] T047 [US2] Run `npm run test:integration` and verify only tests/integration suites run for package.json
- [ ] T048 [US2] Run `npm test` and verify integration suites remain excluded after real-DB integration changes in package.json

**Checkpoint**: User Story 2 is independently functional; integration tests have a dedicated command and use the real DB-backed API with OpenAI mocked only.

---

## Phase 5: User Story 3 - Parallelize CI Feedback (Priority: P3)

**Goal**: Split CI into independent build, lint, unit/contract coverage, and integration test jobs, with integration CI preparing the `.env.test` database.

**Independent Test**: Inspect `.github/workflows/ci.yml` and verify four independent jobs exist, no `npm test` CI job or step exists, and the integration job runs `npm run db:init -- --env .env.test` before `npm run test:integration`.

### Tests for User Story 3

- [ ] T049 [P] [US3] Add failing workflow contract assertions for four independent CI jobs and no CI `npm test` step in src/test-workflow.contract.test.ts
- [ ] T050 [P] [US3] Add failing workflow contract assertion that integration CI runs `npm run db:init -- --env .env.test` before `npm run test:integration` in src/test-workflow.contract.test.ts

### Implementation for User Story 3

- [ ] T051 [US3] Replace the single serial CI job with a `build` job running `npm run build` in .github/workflows/ci.yml
- [ ] T052 [P] [US3] Add a `unit-contract-coverage` job running `npm run test:coverage` in .github/workflows/ci.yml
- [ ] T053 [P] [US3] Add an `integration-tests` job running `npm run db:init -- --env .env.test` then `npm run test:integration` in .github/workflows/ci.yml
- [ ] T054 [P] [US3] Add a `lint` job running `npm run lint` in .github/workflows/ci.yml
- [ ] T055 [US3] Remove the redundant CI `npm test` step from .github/workflows/ci.yml
- [ ] T056 [US3] Verify CI jobs have no `needs` dependencies in .github/workflows/ci.yml

**Checkpoint**: User Story 3 is independently functional; CI exposes separate parallel validation jobs and prepares the integration database.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the full workflow and update contributor-facing documentation.

- [ ] T057 [P] Update test command and integration database setup documentation in README.md
- [ ] T058 [P] Confirm quickstart validation steps remain accurate in specs/007-rethink-tests/quickstart.md
- [ ] T059 Run `npm run build` to verify production build remains unchanged for package.json
- [ ] T060 Run `npm test` to verify unit/contract-only fast tests and workflow contract tests pass for package.json
- [ ] T061 Run `npm run test:coverage` to verify unit/contract coverage passes the >=95% threshold for jest.config.ts
- [ ] T062 Run `npm run db:init -- --env .env.test` to verify real test database setup for .env.test
- [ ] T063 Run `npm run test:integration -- --verbose` to verify real-DB integration tests pass for tests/integration/mobile-api.integration.test.ts
- [ ] T064 Run `npm run lint` to verify TypeScript, test, and workflow changes are lint-clean for eslint.config.js
- [ ] T065 Run `git diff --check` to verify whitespace in package.json, jest.config.ts, .github/workflows/ci.yml, .env.test, README.md, src/test-workflow.contract.test.ts, and tests/integration/mobile-api.integration.test.ts
- [ ] T066 Inspect `git diff -- package.json jest.config.ts .github/workflows/ci.yml .env.test README.md src/test-workflow.contract.test.ts tests/integration/mobile-api.integration.test.ts` and confirm product business logic did not change outside required test infrastructure

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on Setup; defines workflow contract structure and suite-selection expectations.
- **User Story 1 (Phase 3)**: Depends on Foundational; MVP for fast local verification and does not require real-DB integration fixture work.
- **User Story 2 (Phase 4)**: Depends on Foundational; can be validated independently with `npm run db:init -- --env .env.test` and `npm run test:integration`.
- **User Story 3 (Phase 5)**: Depends on US1 and US2 because CI jobs call the revised npm scripts and the integration DB setup command.
- **Polish (Phase 6)**: Depends on desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Requires Phase 2; no dependency on US2 or US3.
- **User Story 2 (P2)**: Requires Phase 2; no dependency on US3, but should verify it does not regress US1 command behavior.
- **User Story 3 (P3)**: Requires US1 and US2 scripts and integration setup to exist before CI can call them.

### Within Each User Story

- Tests and contract assertions should be written first and observed failing where practical.
- Update command/config files before running validation commands.
- For mobile API integration scenarios, reset DB state before setup, then create all required data inside the scenario.
- Do not modify product business logic.
- Preserve the coverage threshold before moving to CI changes.

### Parallel Opportunities

- T002, T003, T004, T005, T006, T007, and T008 can run in parallel during Setup.
- T013 can run in parallel with US1 script implementation once expected command strings are agreed.
- T019 through T023 can run in parallel because they target different assertions in the integration suite and workflow contract file.
- T039 through T045 can be developed independently by endpoint after the real DB fixture and OpenAPI comparison task are ready.
- T052, T053, and T054 can be drafted independently before final YAML reconciliation.
- T057 and T058 can run in parallel during Polish because README and quickstart are separate files.

---

## Parallel Example: User Story 2

```bash
# After the real DB fixture and cleanup helper exist, endpoint coverage can be split by endpoint:
Task: "Add POST /api/v1/signin negative scenarios for 400, 409, and 429 OpenAPI responses in tests/integration/mobile-api.integration.test.ts"
Task: "Add POST /api/v1/login negative scenarios for 400, 401, and 429 OpenAPI responses in tests/integration/mobile-api.integration.test.ts"
Task: "Add GET /api/v1/measurements/{id} negative scenarios for 401 and 404 OpenAPI responses in tests/integration/mobile-api.integration.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational workflow contract setup.
3. Complete Phase 3: User Story 1.
4. Stop and validate with `npm test` and `npm run test:coverage`.
5. Confirm both commands run unit/contract tests only and coverage still passes.

### Incremental Delivery

1. Setup + Foundational: clarify current scripts, Jest selection, CI shape, and workflow contract test structure.
2. Add User Story 1: make fast and coverage commands unit/contract-only.
3. Add User Story 2: add `.env.test`, make integration command real-DB-backed, and expand endpoint coverage.
4. Add User Story 3: split CI into parallel jobs that call the revised commands and prepare the integration DB.
5. Polish: update docs and run all validation commands.

### Parallel Team Strategy

With multiple developers:

1. One developer updates local npm/Jest command selection for US1.
2. One developer builds the real DB mobile API integration fixture for US2.
3. Other developers add endpoint-specific OpenAPI 4xx scenarios after the fixture is ready.
4. Another developer drafts CI job splitting after scripts and DB setup command are stable.
5. Documentation updates can proceed once command names and setup commands are stable.

---

## Notes

- [P] tasks = different files or independently draftable work with no dependency on incomplete tasks.
- [Story] label maps task to a specific user story for traceability.
- Every story has an independent command or workflow validation path.
- Integration tests may mock OpenAI only.
- Existing unit/contract assertions must not be changed logically.
- Product business logic must not be changed.
- CI coverage gate must remain at or above 95%.
- Keep implementation MCP-free and use local repository tooling only.
