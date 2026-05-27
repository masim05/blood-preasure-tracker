# Feature Specification: Rethink Tests

**Feature Branch**: `007-rethink-tests`

**Created**: 2026-05-28

**Status**: Draft

**Input**: User description: "rethink tests. 1. remove the separate Test step from CI because coverage already runs the same unit and contract tests. 2. Modify npm test and npm run test:coverage to run only unit and contract tests. 3. Add npm run test:integration to run integration tests only. 4. Add npm run test:integration to CI as a separate step. 5. lint, build, unit test and integration tests should be separate CI jobs running in parallel."

## Clarifications

### Session 2026-05-28

- Q: Which command should represent the unit/contract CI job? → A: `npm run test:coverage`
- Q: How should integration tests isolate real database state? → A: Reset relevant DB data before each endpoint-level scenario; tests must be independent.
- Q: Which negative-path responses should mobile API integration tests cover? → A: All documented 4xx responses for implemented mobile API endpoints.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run Fast Verification Locally (Priority: P1)

As a developer, I want the default local test commands to run only unit and contract tests so I can get quick feedback without invoking slower integration flows.

**Why this priority**: Local feedback speed is the main value of the change and directly affects every development cycle.

**Independent Test**: Run the default test command and verify it executes unit and contract tests while excluding integration tests.

**Acceptance Scenarios**:

1. **Given** the repository has unit, contract, and integration tests, **When** a developer runs the default test command, **Then** only unit and contract tests are executed.
2. **Given** the repository has integration tests, **When** a developer runs the default coverage command, **Then** coverage is gathered from unit and contract tests only.

---

### User Story 2 - Run Integration Tests Explicitly (Priority: P2)

As a developer, I want a dedicated integration test command so I can run slower end-to-end checks intentionally and independently from fast verification.

**Why this priority**: Integration coverage remains required, but it should be explicit and separable from fast unit and contract feedback.

**Independent Test**: Run the dedicated integration test command and verify it executes integration tests only.

**Acceptance Scenarios**:

1. **Given** the repository has integration tests and non-integration tests, **When** a developer runs the integration test command, **Then** only integration tests are executed.
2. **Given** `.env.test` contains test database credentials, **When** a developer runs `npm run db:init -- --env .env.test` followed by `npm run test:integration`, **Then** integration tests use the real test database and mock only OpenAI.
3. **Given** endpoint-level integration scenarios share the same test database, **When** each scenario starts, **Then** relevant database state is reset so scenarios remain independent and order-insensitive.

---

### User Story 3 - Parallelize CI Feedback (Priority: P3)

As a contributor, I want build, lint, unit/contract coverage, and integration tests to run as separate CI jobs so pull request feedback arrives faster and failures are easier to identify.

**Why this priority**: CI structure improves review throughput after the local command split is defined.

**Independent Test**: Inspect a CI run and verify separate jobs exist for build, lint, unit/contract coverage, and integration tests, with independent pass/fail results.

**Acceptance Scenarios**:

1. **Given** a pull request or main-branch push triggers CI, **When** the workflow starts, **Then** build, lint, unit/contract test coverage, and integration tests run as separate jobs that can execute in parallel.
2. **Given** unit and contract test coverage already executes the fast test set, **When** CI runs, **Then** it does not run a redundant non-coverage fast test step in the same job.

### Edge Cases

- If a test file is moved between unit, contract, and integration categories, command selection must still be based on the intended category and not accidentally run it in multiple categories.
- If the fast test command passes but integration tests fail, CI must show the integration job failure separately without hiding the successful fast-test result.
- If integration tests share fixtures or helper files, those dependencies may remain available to integration tests without being treated as integration test suites themselves.
- If coverage thresholds fail, the coverage command must fail even though the non-coverage unit and contract command would otherwise pass.
- If an integration scenario writes database state, later endpoint-level scenarios must not depend on that state unless they create it explicitly in their own setup.
- If OpenAI recognition is needed during integration tests, only the OpenAI boundary may be mocked; database, password hashing, bearer token storage, measurement storage, image storage, and request handling must use real application infrastructure configured through `.env.test`.

## Architecture & Test Impact *(mandatory)*

- **Ports Affected**: N/A.
- **Adapters Affected**: N/A.
- **Boundary Guarantee**: The change is limited to test command selection, CI workflow orchestration, and integration-test infrastructure/coverage; domain logic and production adapter behavior remain unchanged.
- **Node.js Version Baseline**: Existing project baseline remains the repository-defined Node.js version.
- **NestJS Version Baseline**: Existing project baseline remains unchanged.
- **Dependency Selection Rationale**: No new runtime or test dependencies are expected; existing project tooling should be used.
- **Existing Test Impact**: Existing unit and contract test assertions keep the same behavior. Mobile API integration tests may be rewired to real infrastructure, renamed for endpoint clarity, and expanded with requirement-driven endpoint assertions.
- **New Test Coverage**: Add workflow contract tests that validate npm script selection and CI job structure. Add mobile API integration scenarios for real-DB setup, endpoint independence, OpenAI-only mocking, endpoint describe naming, and all documented OpenAPI 4xx responses for implemented mobile API endpoints.
- **Integration Test Environment**: Add and git-track `.env.test`; integration tests load credentials from this file and are prepared with `npm run db:init -- --env .env.test` before `npm run test:integration`.
- **Integration Test Isolation**: Integration tests that exercise endpoint behavior reset relevant real database state before each endpoint-level scenario so scenarios are independent.
- **Integration Mocking Boundary**: Integration tests mock OpenAI only; all other dependencies use real project infrastructure and configuration.
- **Coverage Plan**: Preserve the existing coverage threshold for unit and contract tests. Integration tests run separately and are not required to contribute to coverage metrics unless already included by project policy.
- **Worktree Path**: Implementation MUST occur in the dedicated feature worktree `tmp/007-rethink-tests`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The default fast test command MUST execute unit and contract tests only.
- **FR-002**: The coverage command MUST execute unit and contract tests only and MUST preserve the existing coverage threshold behavior.
- **FR-003**: The system MUST provide a dedicated integration test command that executes integration tests only.
- **FR-004**: The CI workflow MUST include a separate integration test job that runs the dedicated integration test command.
- **FR-005**: The CI workflow MUST use `npm run test:coverage` as the unit/contract CI job and MUST NOT include a separate `npm test` CI job.
- **FR-006**: The CI workflow MUST run build, lint, unit/contract coverage, and integration tests as separate jobs that are eligible to run in parallel.
- **FR-007**: CI job names and failure boundaries MUST make it clear whether a failure came from build, lint, unit/contract coverage, or integration tests.
- **FR-008**: Existing unit, contract, and integration test assertions MUST NOT be changed logically as part of this feature.
- **FR-009**: Product business logic MUST NOT change as part of this feature.
- **FR-010**: Integration test dependencies and fixtures may remain outside colocated source tests when they are used by integration tests.
- **FR-011**: The revised commands MUST be documented through the project command surface used by contributors.
- **FR-012**: The feature MUST add workflow contract tests that verify npm script category selection and CI job structure without changing existing test assertions.
- **FR-013**: The repository MUST include a git-tracked `.env.test` file containing non-secret test defaults, including the test `DATABASE_URL` used by integration tests.
- **FR-014**: Mobile API integration tests MUST load database credentials from `.env.test` and run against the real PostgreSQL-backed repositories after `npm run db:init -- --env .env.test`.
- **FR-015**: Mobile API integration tests MUST mock only OpenAI; in-memory stores or fake application infrastructure MUST NOT replace database, storage, auth, hashing, or request handling dependencies.
- **FR-016**: Each endpoint-level integration `describe` block MUST use the specific format `<METHOD> <path> - <scenario>`, for example `POST /api/v1/signin - happy path`.
- **FR-017**: Endpoint-level integration tests MUST reset relevant database state before each scenario so tests are independent and do not rely on execution order.
- **FR-018**: Mobile API integration tests MUST include endpoint scenarios for every documented 4xx response on implemented mobile API endpoints, using the OpenAPI document as the reference.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Running the default fast test command executes 0 integration test suites.
- **SC-002**: Running the coverage command executes 0 integration test suites and still enforces the configured coverage threshold.
- **SC-003**: Running the integration test command executes 100% of integration test suites and 0 unit or contract test suites.
- **SC-004**: CI presents four independent jobs: build, lint, unit/contract coverage, and integration tests.
- **SC-005**: A failure in one CI job can be identified from the job name without reading logs from other jobs.
- **SC-006**: No product source files change except where necessary to keep test discovery or command configuration valid.
- **SC-007**: Workflow contract tests fail before implementation and pass after npm script and CI workflow changes are complete.
- **SC-008**: Running `npm run db:init -- --env .env.test` followed by `npm run test:integration` succeeds using a real test database and mocked OpenAI only.
- **SC-009**: Reordering endpoint-level mobile API integration scenarios does not change pass/fail outcomes because each scenario sets up its own required state.
- **SC-010**: Endpoint-level mobile API integration `describe` names identify the HTTP method, path, and scenario outcome without reading nested test names.
- **SC-011**: Negative-path integration tests cover all documented 4xx OpenAPI responses for implemented mobile API endpoints.

## Assumptions

- Existing test file naming and folder conventions can distinguish unit, contract, and integration suites.
- The coverage command is the authoritative unit/contract verification gate in CI.
- Integration tests should remain part of required CI validation even though they are separated from coverage.
- CI job setup may duplicate dependency installation steps in order to allow jobs to run independently and in parallel.
- The `.env.test` file contains local test defaults only and must not contain real secrets.
