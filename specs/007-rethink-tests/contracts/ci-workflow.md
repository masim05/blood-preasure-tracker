# Contract: CI Workflow

## Trigger Scope

The workflow continues to run for pull requests targeting `main` and pushes to `main`.

## Required Jobs

### Build

**Command**: `npm run build`

**Required behavior**:

- Checks out the repository.
- Sets up Node.js 24 with npm cache.
- Installs dependencies with `npm ci`.
- Runs the build command.

### Unit/Contract Coverage

**Command**: `npm run test:coverage`

**Required behavior**:

- Checks out the repository.
- Sets up Node.js 24 with npm cache.
- Installs dependencies with `npm ci`.
- Runs coverage for unit and contract tests only.
- Does not run a separate `npm test` step.

### Integration Tests

**Command**: `npm run test:integration`

**Required behavior**:

- Checks out the repository.
- Sets up Node.js 24 with npm cache.
- Installs dependencies with `npm ci`.
- Runs integration suites only.

### Lint

**Command**: `npm run lint`

**Required behavior**:

- Checks out the repository.
- Sets up Node.js 24 with npm cache.
- Installs dependencies with `npm ci`.
- Runs lint.

## Parallelism

The four jobs must be independent and must not declare dependencies on each other unless a future feature explicitly requires ordering. This makes them eligible for parallel execution in GitHub Actions.

## Failure Attribution

Each job name must identify the failing gate without needing logs from another job: build, unit/contract coverage, integration tests, or lint.

## Required Workflow Contract Tests

Add CI workflow assertions to `src/test-workflow.contract.test.ts`.

The test file must verify:

- `.github/workflows/ci.yml` defines independent jobs for build, unit/contract coverage, integration tests, and lint.
- The unit/contract coverage job runs `npm run test:coverage`.
- The integration job runs `npm run test:integration`.
- No CI job or step runs `npm test`.
- The four validation jobs do not depend on each other through `needs`.
