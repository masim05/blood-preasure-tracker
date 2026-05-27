# Quickstart: Rethink Tests

## Local Validation

1. Install dependencies if needed:

   ```bash
   npm ci
   ```

2. Run the production build:

   ```bash
   npm run build
   ```

3. Run fast unit/contract tests only:

   ```bash
   npm test
   ```

   Expected result: Jest reports only colocated tests under `src/`, including `src/test-workflow.contract.test.ts`; integration suites under `tests/integration/` do not run.

4. Run unit/contract coverage only:

   ```bash
   npm run test:coverage
   ```

   Expected result: Jest reports only colocated tests under `src/`, including workflow contract tests, collects coverage from configured source files, and enforces the `>= 95%` threshold.

5. Run integration tests only:

   ```bash
   npm run test:integration
   ```

   Expected result: Jest reports only suites under `tests/integration/`.

6. Run lint:

   ```bash
   npm run lint
   ```

## CI Validation

Open a pull request or push to `main` and verify GitHub Actions shows four independent jobs:

- Build
- Unit/Contract Coverage
- Integration Tests
- Lint

The workflow must not include a separate CI job or step that runs `npm test`; the coverage job is the unit/contract CI test gate.
