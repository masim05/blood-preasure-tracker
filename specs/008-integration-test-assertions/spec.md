# Feature Specification: Integration Test Assertions

**Feature Branch**: `008-integration-test-assertions`

**Created**: 2026-05-28

**Status**: Draft

**Input**: User description: "integration test maintenance. Assert HTTP response code and response format separately in `mobile API integration flow`; for every endpoint-level describe block, replace combined assertions such as `creates a user and bearer token in PostgreSQL` with separate examples like `responds with HTTP <code>`, `responds with proper json`, and specific persistence assertions. No business logic code must change. No other tests must change. No new test files. Worktree isolation is waived for this maintenance change."

## Clarifications

### Session 2026-05-28

- Q: Should implementation keep existing endpoint-level `describe` blocks or split multi-request scenarios into new `describe` blocks? → A: Keep each existing `describe`; split assertions within it for the scenario's primary response, use binary-format wording for image responses, and keep separate persistence/log assertions.
- Q: Should this maintenance change add new test files or use a dedicated worktree? → A: No new test files; only `tests/integration/mobile-api.integration.test.ts` may change, and worktree isolation is explicitly waived for this run.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Readable Response Assertions (Priority: P1)

A reviewer reading the mobile API integration test output can immediately see whether each endpoint scenario validated the HTTP status and the response body shape as separate concerns.

**Why this priority**: The main requested value is clearer test output. Splitting response status and response format makes failures easier to identify without reading test implementation details.

**Independent Test**: Run the mobile API integration suite in verbose mode and inspect the `mobile API integration flow` output. Each existing endpoint-level scenario must keep its current `describe` name and include separate assertion names for the primary HTTP response code and response format whenever the scenario returns a response body.

**Acceptance Scenarios**:

1. **Given** the `POST /api/v1/signin - happy path` scenario, **When** the integration suite runs, **Then** the output lists separate examples for `responds with HTTP 201` and `responds with proper json` without renaming the `describe` block.
2. **Given** any endpoint-level negative scenario that returns a JSON error body, **When** the integration suite runs, **Then** the output lists separate examples for the documented HTTP code and the error response format without creating additional `describe` blocks.

---

### User Story 2 - Readable Persistence Assertions (Priority: P2)

A reviewer can distinguish HTTP contract failures from database or storage persistence failures in each endpoint scenario.

**Why this priority**: Integration tests already verify real infrastructure. Naming persistence checks separately makes failures actionable and preserves confidence that real database-backed behavior is still covered.

**Independent Test**: Run the mobile API integration suite in verbose mode and confirm each endpoint-level scenario with persistence side effects lists separate examples for each persisted outcome.

**Acceptance Scenarios**:

1. **Given** the `POST /api/v1/signin - happy path` scenario, **When** the integration suite runs, **Then** it lists separate examples for creating a user in PostgreSQL and creating a bearer token in PostgreSQL.
2. **Given** the `POST /api/v1/measurements - happy path` scenario, **When** the integration suite runs, **Then** it lists separate examples for the measurement record, stored image, queued recognition task, and absence of OpenAI calls during upload.
3. **Given** scenarios that do not create or mutate persisted state beyond setup, **When** the integration suite runs, **Then** they do not invent persistence assertions unrelated to the scenario outcome.

---

### User Story 3 - Scoped Test-Only Change (Priority: P3)

A maintainer can review the change knowing it only reorganizes assertions in the mobile API integration flow and does not alter product behavior or unrelated tests.

**Why this priority**: The request explicitly prohibits business logic changes and changes to other tests. Preserving scope keeps the review low risk.

**Independent Test**: Inspect the diff and verify only the mobile API integration test file changes for assertion restructuring, with no production code changes and no changes to other test suites.

**Acceptance Scenarios**:

1. **Given** the final diff, **When** a reviewer checks changed files, **Then** no business logic source files are modified.
2. **Given** the final diff, **When** a reviewer checks test changes, **Then** no test files outside the mobile API integration suite are modified.

---

### Edge Cases

- Scenarios that return binary image data should keep their existing `describe` block, assert the HTTP status separately, and use a response-format name appropriate to the binary response rather than calling it JSON.
- Scenarios that perform multiple persistence side effects should expose each distinct side effect as its own assertion name.
- Scenarios that only verify an error response should still split HTTP status and response body format into separate examples.
- Shared scenario setup must remain isolated so splitting assertions does not create order-dependent tests.

## Architecture & Test Impact *(mandatory)*

- **Ports Affected**: N/A; no domain ports are introduced or changed.
- **Adapters Affected**: N/A; no concrete adapters are introduced or changed.
- **Boundary Guarantee**: The change is limited to integration test assertion organization and must not change domain, application, adapter, or infrastructure behavior.
- **Node.js Version Baseline**: Existing project baseline remains Node.js 24.x or newer.
- **NestJS Version Baseline**: Existing project baseline remains NestJS 11.
- **Dependency Selection Rationale**: No new dependencies are required; existing test runner behavior is sufficient.
- **Existing Test Impact**: Only `tests/integration/mobile-api.integration.test.ts` may change, and only inside the `mobile API integration flow` suite.
- **New Test Coverage**: No new product coverage area is required; existing endpoint scenarios are reorganized into clearer assertions.
- **Coverage Plan**: Preserve the current coverage gates by avoiding production-code changes and keeping existing integration behavior intact.
- **Worktree Path**: N/A for this maintenance change; maintainer explicitly waived dedicated worktree isolation for this run.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each endpoint-level describe block inside `mobile API integration flow` MUST expose the HTTP response code assertion as a separate example named `responds with HTTP <code>`.
- **FR-002**: Each JSON-returning endpoint-level describe block inside `mobile API integration flow` MUST expose the response body contract as a separate example named `responds with proper json`.
- **FR-003**: Each binary-response endpoint-level describe block inside `mobile API integration flow` MUST expose the response body contract with a separate example name that clearly describes the binary image response format.
- **FR-004**: Endpoint-level scenarios with PostgreSQL side effects MUST expose each meaningful database assertion as a separate example with a specific persistence-oriented name.
- **FR-005**: Endpoint-level scenarios with filesystem or OpenAI-boundary assertions MUST expose those checks as separate examples with specific names.
- **FR-006**: Combined examples that assert HTTP response, response format, and persistence in one test MUST be split into focused examples.
- **FR-007**: The implementation MUST preserve the existing endpoint-level describe block names.
- **FR-008**: The implementation MUST NOT split existing endpoint-level scenarios into additional endpoint-level `describe` blocks solely to satisfy assertion naming.
- **FR-009**: The implementation MUST preserve existing test setup, cleanup, real database usage, real filesystem usage, and OpenAI-only mocking behavior.
- **FR-010**: No product business logic code may change.
- **FR-011**: No tests outside `tests/integration/mobile-api.integration.test.ts` may change.
- **FR-012**: The integration suite MUST continue to pass with the existing command sequence: initialize the `.env.test` database, then run the integration test command.
- **FR-013**: Development workflow MUST remain MCP-free and use normal repository commands for validation.
- **FR-014**: The implementation MUST NOT add new test files.

### Key Entities

- **Endpoint Scenario**: A named endpoint-level integration scenario under `mobile API integration flow`, such as a happy path or documented negative path.
- **Response Assertion**: A focused example that validates either status code or response body format for one endpoint scenario.
- **Persistence Assertion**: A focused example that validates database, filesystem, or external-boundary side effects for one endpoint scenario.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of endpoint-level describe blocks inside `mobile API integration flow` include a separate HTTP status assertion.
- **SC-002**: 100% of JSON-returning endpoint-level describe blocks inside `mobile API integration flow` include a separate response-format assertion.
- **SC-003**: 100% of endpoint-level describe blocks with side-effect checks expose each meaningful side effect as a separately named assertion.
- **SC-004**: The verbose integration test output makes the failing concern identifiable from the example name alone for every endpoint-level scenario.
- **SC-005**: The final diff contains no product business logic changes and no changes to test files outside the mobile API integration suite.
- **SC-006**: The mobile API integration suite completes successfully after the assertion split.

## Assumptions

- This is test maintenance/assertion restructuring, not a product feature.
- Existing endpoint-level describe block names are already acceptable and should remain unchanged.
- Existing scenario setup and cleanup are sufficient for splitting assertions without introducing order dependence.
- Response-format assertions should preserve the current expected bodies; this feature changes assertion granularity and names, not expected API behavior.
- Binary image responses should use response-format wording appropriate to image bytes and headers rather than `proper json`.
