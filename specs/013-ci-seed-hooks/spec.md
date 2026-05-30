# Feature Specification: CI Seed Hooks

**Feature Branch**: `017-move-seed-before-hooks`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "CI improvement. work in separate worktree dedicated to this task only. move all seeds from .github/workflows/ci.yml to `before` hooks. no changes to happen outside ci yml and test bootstrap."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remove Inline CI Seeds (Priority: P1)

As a maintainer, I want the Android CI job to obtain its Maestro test fixtures from the repository's shared Jest test bootstrap lifecycle instead of inline workflow seed scripts, so the workflow stays readable and fixture setup stays reusable.

**Why this priority**: The current inline seed block is the main source of duplication and the direct target of the requested CI improvement.

**Independent Test**: Run the Android CI validation path against a clean test database and confirm the required Maestro users and saved measurement exist before the Maestro flows start, while the workflow definition no longer contains inline seed payloads.

**Acceptance Scenarios**:

1. **Given** a clean CI database and the Android validation job, **When** the shared Jest test bootstrap hook runs after database initialization, **Then** the Maestro login and history fixtures are created before Android and Maestro validation begins.
2. **Given** the CI workflow definition is reviewed, **When** the Android validation job is inspected, **Then** fixture seeding is delegated to shared bootstrap logic rather than embedded inline seed code in the workflow file.

---

### User Story 2 - Keep Seed Setup Reusable and Safe (Priority: P2)

As a maintainer, I want the seed setup to be idempotent and isolated to test bootstrap code, so reruns and local reproduction do not create duplicate data or alter application runtime paths.

**Why this priority**: Moving seeds out of the workflow only helps if the replacement path is stable across retries and remains confined to test-only execution.

**Independent Test**: Execute the shared Jest test bootstrap path more than once against the same test database and confirm it finishes successfully with the same required fixtures present and no production bootstrap changes.

**Acceptance Scenarios**:

1. **Given** the test database already contains the required Maestro fixtures, **When** the shared Jest test bootstrap hook runs again, **Then** it completes successfully without duplicate-fixture failures.
2. **Given** application runtime entry points are inspected, **When** the feature is delivered, **Then** the seed logic is reachable only from test bootstrap paths and not from production startup flows.

---

### User Story 3 - Preserve CI Gate Visibility (Priority: P3)

As a maintainer, I want automated tests to enforce the new seed location, so future workflow edits do not silently move fixture creation back into the CI YAML.

**Why this priority**: The improvement needs a regression signal or the workflow can drift back to inline seeds.

**Independent Test**: Run the contract and bootstrap-focused tests and confirm they fail if inline seed code returns to the workflow or if required fixtures are no longer prepared by the shared Jest test bootstrap hook.

**Acceptance Scenarios**:

1. **Given** CI contract validation runs, **When** the workflow file includes inline Maestro seed payloads again, **Then** the validation fails.
2. **Given** bootstrap-focused validation runs, **When** required Maestro fixtures are missing from the shared Jest test bootstrap output, **Then** the validation fails before merge.

### Edge Cases

- What happens when the shared Jest test bootstrap hook runs more than once against the same test database? It must leave the required fixtures in place without duplicate-key or conflicting-state failures.
- How does the system handle a database that has been initialized but is temporarily unavailable when the seed hook starts? The Android CI job must fail before test execution begins rather than producing misleading Maestro failures.
- What happens when non-Android CI jobs run? They must keep their current behavior and avoid pulling in Android-only seed fixtures.

## Architecture & Test Impact *(mandatory)*

- **Ports Affected**: N/A
- **Adapters Affected**: CI workflow orchestration and existing Jest test bootstrap support only
- **Boundary Guarantee**: Seed preparation remains in test-only Jest bootstrap code and does not alter domain logic, API runtime flows, or production startup paths
- **Node.js Version Baseline**: 24.x active LTS
- **NestJS Version Baseline**: 11.x active LTS
- **Android Source Location**: N/A
- **Kotlin Version Baseline**: N/A
- **API Error UX**: N/A
- **Localization Impact**: N/A
- **Maestro Coverage**: Existing Android Maestro happy-path flows continue to rely on shared seeded fixtures; no new mobile stories are introduced
- **Mobile Unit Coverage**: N/A
- **Dependency Selection Rationale**: Reuse existing repository tooling and dependencies for database seeding and test bootstrap; no new third-party packages are expected
- **Existing Test Impact**: Update workflow contract coverage and Jest test-bootstrap validation only; API behavior tests and application runtime tests remain unchanged
- **New Test Coverage**: Contract coverage that rejects inline workflow seed payloads and bootstrap-focused coverage that verifies required Maestro fixtures are prepared idempotently by the shared Jest test bootstrap path
- **Coverage Plan**: Maintain the current CI coverage gate by extending existing contract/bootstrap tests for the moved seed logic rather than reducing assertions
- **Worktree Path**: tmp/017-move-seed-before-hooks

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST prepare all Maestro-required test fixtures through the repository's shared Jest test bootstrap lifecycle instead of inline seed scripts embedded in the CI workflow definition.
- **FR-002**: The Android CI validation job MUST initialize the test database before executing any seed hook.
- **FR-003**: The Android CI validation job MUST invoke the shared Jest test bootstrap path before Android build, unit coverage, or Maestro happy-path execution depends on seeded data.
- **FR-004**: The CI workflow definition MUST NOT contain inline Node, SQL, or shell payloads whose purpose is to create Maestro accounts or Maestro history fixtures.
- **FR-005**: The shared Jest test bootstrap path MUST be idempotent so repeated execution against the same test database completes successfully.
- **FR-006**: The shared Jest test bootstrap path MUST create the authenticated-user and saved-measurement fixtures required by the existing Maestro login and history flows.
- **FR-007**: Changes for this feature MUST be limited to the CI workflow definition, test bootstrap support, and feature documentation under `specs/013-ci-seed-hooks`; no application runtime code, API code, or API behavior tests may change.
- **FR-008**: Non-Android CI jobs MUST preserve their current purpose and execution order.
- **FR-009**: Development workflow MUST remain MCP-free and execute in a dedicated feature worktree under `tmp/`.
- **FR-010**: Runtime and validation tooling MUST continue to target the repository baselines of Node.js 24.x and NestJS 11.x.
- **FR-011**: Dependency decisions MUST prefer existing repository dependencies and utilities; new third-party packages require explicit justification.
- **FR-012**: Automated validation MUST detect regressions if required Maestro fixtures are no longer prepared by the shared Jest test bootstrap path or if inline seed logic returns to the workflow definition.

### Key Entities *(include if feature involves data)*

- **CI Validation Job**: A repository validation gate that prepares environment dependencies and runs a defined subset of checks against a clean runner.
- **Maestro Fixture Set**: The repeatable test data needed for existing Android login and measurement-history happy-path flows.
- **Jest Test Bootstrap Hook**: The shared test-only setup path in the repository's Jest-driven validation lifecycle that runs before dependent validations and is responsible for fixture preparation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a clean runner, the Android CI job prepares all required Maestro fixtures before dependent tests begin with no manual intervention.
- **SC-002**: Repository review of the CI workflow finds zero inline seed payloads for Maestro accounts or measurement history fixtures.
- **SC-003**: Re-running the shared Jest test bootstrap path against the same initialized test database succeeds without duplicate-data failures.
- **SC-004**: Automated contract/bootstrap validation fails whenever seed responsibility moves out of the shared Jest test bootstrap hook or back into the workflow definition.

## Assumptions

- The requested `before` hooks refer specifically to the repository's shared Jest test bootstrap lifecycle, not a separate CI-only script or a GitHub Actions-specific hook mechanism.
- The current Android Maestro happy paths still require seeded authenticated users and at least one saved measurement fixture.
- Database initialization remains a separate CI concern and continues to run before any fixture seeding occurs.
- This feature excludes mobile application changes, API endpoint changes, and production startup-path changes.
