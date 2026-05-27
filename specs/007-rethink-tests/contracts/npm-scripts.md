# Contract: npm Test Scripts

## `npm test`

**Purpose**: Fast local unit/contract verification.

**Required behavior**:

- Runs Jest against colocated unit and contract tests only.
- Includes test files under `src/**/*.test.ts`.
- Excludes `tests/integration/**/*.test.ts`.
- Does not collect coverage.
- Fails if any selected unit or contract test fails.
- Includes workflow contract tests in `src/test-workflow.contract.test.ts`.

## `npm run test:coverage`

**Purpose**: Coverage-gated unit/contract verification.

**Required behavior**:

- Runs the same suite category as `npm test`.
- Includes test files under `src/**/*.test.ts`.
- Excludes `tests/integration/**/*.test.ts`.
- Collects coverage from production source files according to `jest.config.ts`.
- Enforces the configured global threshold of `>= 95%`.
- Fails if tests fail or coverage is below threshold.

## `npm run test:integration`

**Purpose**: Explicit integration verification.

**Required behavior**:

- Runs Jest against integration suites only.
- Includes test files under `tests/integration/**/*.test.ts`.
- Excludes colocated unit and contract tests under `src/**/*.test.ts`.
- Does not collect coverage by default.
- Fails if any selected integration test fails.

## Non-Goals

- Do not change test assertions.
- Do not change product business logic.
- Do not add new test dependencies.

## Required Workflow Contract Tests

Add `src/test-workflow.contract.test.ts` to validate the command surface without exercising product behavior.

The test file must verify:

- `package.json` defines `test` for colocated unit/contract suites only.
- `package.json` defines `test:coverage` for the same colocated unit/contract suite plus coverage.
- `package.json` defines `test:integration` for `tests/integration/**/*.test.ts` suites only.
- Script definitions do not select the same test suite in multiple categories.
