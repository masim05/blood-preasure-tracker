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

5. Initialize the integration test database from tracked test configuration:

   ```bash
   npm run db:init -- --env .env.test
   ```

   Expected result: Docker-backed PostgreSQL is ready, migrations have run, and the database uses the `DATABASE_URL` from `.env.test`.

6. Run integration tests only:

   ```bash
   npm run test:integration
   ```

   Expected result: Jest reports only suites under `tests/integration/`. Mobile API integration tests use the real PostgreSQL-backed application infrastructure, reset relevant database state before each endpoint-level scenario, and mock only OpenAI.

7. Run lint:

   ```bash
   npm run lint
   ```

## Mobile API Integration Expectations

- `.env.test` is committed and contains local non-secret test defaults.
- Endpoint-level `describe` blocks use `<METHOD> <path> - <scenario>` names.
- Scenarios are independent: each endpoint-level scenario creates its own required state after database cleanup.
- Negative-path scenarios cover every documented 4xx response for implemented mobile API endpoints in `docs/openapi.yaml`.
- Integration tests may mock OpenAI only; PostgreSQL repositories, filesystem image storage, auth, hashing, guards, controllers, middleware, and HTTP handling remain real.

## CI Validation

Open a pull request or push to `main` and verify GitHub Actions shows four independent jobs:

- Build
- Unit/Contract Coverage
- Integration Tests
- Lint

The integration job must initialize the `.env.test` database before running `npm run test:integration`. The workflow must not include a separate CI job or step that runs `npm test`; the coverage job is the unit/contract CI test gate.
