# Data Model: Rethink Tests

This feature does not introduce product data entities or persistence changes.

## Workflow Entities

### Test Suite Category

Represents the classification used by npm scripts and CI jobs.

**Fields**:

- `name`: One of `unit-contract` or `integration`.
- `fileScope`: Glob/path scope used to select suites.
- `coverageEligible`: Whether suites contribute to the coverage gate.

**Validation rules**:

- `unit-contract` includes colocated tests under `src/**/*.test.ts`.
- `integration` includes tests under `tests/integration/**/*.test.ts`.
- A test suite must not be selected by both categories.

### Npm Test Command

Represents contributor-facing script entry points.

**Fields**:

- `scriptName`: `test`, `test:coverage`, or `test:integration`.
- `suiteCategory`: Selected test suite category.
- `coverageEnabled`: Whether Jest coverage is enabled.

**Validation rules**:

- `test` selects `unit-contract` and has coverage disabled.
- `test:coverage` selects `unit-contract` and has coverage enabled.
- `test:integration` selects `integration` and has coverage disabled.

### CI Job

Represents an independent GitHub Actions job.

**Fields**:

- `jobId`: Stable workflow job identifier.
- `displayName`: Human-readable job name.
- `command`: npm command executed by the job.

**Validation rules**:

- CI includes jobs for build, lint, unit/contract coverage, and integration tests.
- CI does not include a separate `npm test` job.
- Each job performs its own checkout, Node setup, and dependency install so it can run independently.

## Relationships

- One npm test command selects one test suite category.
- One CI job runs one validation command.
- The unit/contract coverage CI job runs the `test:coverage` npm command.
- The integration CI job runs the `test:integration` npm command.
