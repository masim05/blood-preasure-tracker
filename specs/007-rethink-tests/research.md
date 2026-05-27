# Research: Rethink Tests

## Decision: Use Jest path selection to split fast and integration suites

**Rationale**: Unit and contract tests are colocated under `src/**/*.test.ts`, while integration tests live under `tests/integration/**/*.test.ts`. Path selection keeps the split explicit, preserves current test files, and avoids changing product behavior.

**Alternatives considered**:

- Separate Jest config files: rejected because the current split can be expressed with existing CLI arguments.
- Rename test files by category: rejected because category can already be inferred by path.
- Jest projects: rejected as more configuration than needed for two path-based groups.

## Decision: Keep `npm run test:coverage` as the CI unit/contract job

**Rationale**: The clarified requirement chooses coverage as the authoritative CI unit/contract gate. It runs the same fast suite as `npm test` while enforcing the existing `>= 95%` threshold, so a separate `npm test` CI job would be redundant.

**Alternatives considered**:

- Run both `npm test` and `npm run test:coverage` in CI: rejected because the requirement explicitly avoids the duplicate job.
- Run only `npm test` in CI: rejected because it would drop the coverage gate from CI.
- Run integration tests under coverage: rejected because integration validation is now a separate gate.

## Decision: Add `npm run test:integration` for integration suites only

**Rationale**: A dedicated command gives developers and CI an explicit integration gate. Restricting it to `tests/integration/**/*.test.ts` ensures no colocated unit/contract suites run in the integration command.

**Alternatives considered**:

- Use ad hoc Jest arguments in CI only: rejected because contributors need the same command locally.
- Keep integration tests in the default Jest run: rejected because the feature goal is fast default verification.

## Decision: Split CI into independent jobs

**Rationale**: Build, lint, unit/contract coverage, and integration tests are independent checks. Separate jobs improve failure attribution and allow GitHub Actions to run them in parallel.

**Alternatives considered**:

- Keep one serial job with separate steps: rejected because it does not satisfy parallel job execution.
- Use a matrix job: rejected because build, lint, coverage, and integration use different commands and clearer standalone job names improve diagnostics.

## Decision: Track `.env.test` with non-secret integration defaults

**Rationale**: `npm run db:init -- --env .env.test` already supports alternate env files and creates a Docker-backed PostgreSQL database from `DATABASE_URL`. A tracked `.env.test` makes integration setup reproducible while avoiding real secrets.

**Alternatives considered**:

- Require developers to create `.env.test` manually: rejected because the requirement says to create and git-track it.
- Reuse `.env`: rejected because local development values may point at non-test databases or contain secrets.
- Add a new env loader dependency: rejected because Node 24 includes `process.loadEnvFile` and the repo already parses env files in DB scripts.

## Decision: Mobile API integration tests use real infrastructure and mock only OpenAI

**Rationale**: The integration suite should validate real PostgreSQL repositories, filesystem image storage, password hashing, bearer token storage, guards, controllers, middleware, and request handling. OpenAI is the only external network boundary that must be deterministic and not call a paid remote API.

**Alternatives considered**:

- Continue using in-memory stores: rejected because it violates the clarified real-DB requirement.
- Mock all outbound adapters: rejected because the clarified requirement allows mocking OpenAI only.
- Start the compiled HTTP server as a child process: rejected for planning because Nest testing can instantiate the real module graph with less process orchestration while still exercising real HTTP requests.

## Decision: Reset relevant database state before each endpoint-level scenario

**Rationale**: Tests must be independent. Truncating or deleting rows from `recognition_tasks`, `measurement_images`, `measurements`, `bearer_tokens`, and `user_accounts` before each endpoint-level `describe` prevents order coupling while preserving realistic database behavior inside each scenario.

**Alternatives considered**:

- Run `db:init` once and share state: rejected because scenarios would become order-dependent.
- Wrap each scenario in a transaction and roll back: rejected because HTTP requests and repository pools do not naturally share one transaction boundary.
- Recreate the Docker container for every scenario: rejected as much slower than clearing tables in the test database.

## Decision: Negative-path integration coverage follows all documented OpenAPI 4xx responses

**Rationale**: The OpenAPI document is the endpoint contract reference. Covering every documented 4xx response for implemented mobile API endpoints ensures validation, auth, not-found, conflict, and rate-limit behavior remain executable without requiring brittle 5xx fault injection.

**Alternatives considered**:

- One representative negative path per endpoint: rejected by clarification.
- Include all 5xx responses too: rejected because the clarification is limited to documented 4xx responses and 5xx paths are not always deterministic.
