# Data Model: Rethink Tests

This feature does not introduce product data entities or persistence schema changes. It introduces workflow and test-environment entities that define how existing product data is exercised.

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
- `requiresDatabase`: Whether the command expects the test database to be initialized.

**Validation rules**:

- `test` selects `unit-contract`, has coverage disabled, and does not require the integration database.
- `test:coverage` selects `unit-contract`, has coverage enabled, and does not require the integration database.
- `test:integration` selects `integration`, has coverage disabled, and expects `.env.test` plus an initialized test database for mobile API integration suites.

### CI Job

Represents an independent GitHub Actions job.

**Fields**:

- `jobId`: Stable workflow job identifier.
- `displayName`: Human-readable job name.
- `command`: npm command executed by the job.
- `databasePreparation`: Whether the job initializes the `.env.test` database before running.

**Validation rules**:

- CI includes jobs for build, lint, unit/contract coverage, and integration tests.
- CI does not include a separate `npm test` job.
- Each job performs its own checkout, Node setup, and dependency install so it can run independently.
- The integration job prepares the test database before running `npm run test:integration`.

## Integration Test Entities

### Test Environment Configuration

Represents the tracked `.env.test` file used by integration setup.

**Fields**:

- `DATABASE_URL`: Local PostgreSQL connection string for the test database.
- `OPENAI_API_KEY`: Non-secret placeholder value required by config loading while OpenAI is mocked.
- `CLI_PROVIDER`: Provider name used by existing config defaults.
- `CLI_MODEL`: Model name used by existing config defaults.
- `API_PORT`: Test API port default when running compiled API flows.
- `MEASUREMENT_IMAGE_DIR`: Test-only filesystem path for uploaded images.
- `ACCESS_TOKEN_TTL_SECONDS`: Token lifetime for auth integration flows.
- `NODE_ENV`: Test/development mode for logging behavior.

**Validation rules**:

- `.env.test` must be committed and contain only local non-secret defaults.
- `DATABASE_URL` must identify a local PostgreSQL database suitable for destructive test cleanup.
- Integration tests must not read database credentials from `.env`.

### Endpoint Scenario

Represents an endpoint-level `describe` block in mobile API integration tests.

**Fields**:

- `method`: HTTP method, such as `POST` or `GET`.
- `path`: OpenAPI path, such as `/api/v1/signin`.
- `scenario`: Human-readable outcome, such as `happy path` or `email already taken`.
- `expectedStatus`: HTTP status asserted by the scenario.
- `setupState`: State created explicitly for the scenario.
- `openApiReference`: Matching response entry in `docs/openapi.yaml`.

**Validation rules**:

- Name format is `<METHOD> <path> - <scenario>`.
- Each scenario resets relevant database rows before setup.
- Each scenario creates all state it needs and does not depend on previous scenarios.
- Negative-path scenarios cover every documented 4xx response for implemented mobile API endpoints.

### Integration Dependency Boundary

Represents the allowed test double policy for mobile API integration tests.

**Fields**:

- `dependency`: Boundary or adapter name.
- `mode`: `real` or `mocked`.
- `reason`: Why the dependency uses that mode.

**Validation rules**:

- OpenAI/`LLM_PROVIDER` is mocked to avoid remote network calls and make recognition deterministic.
- PostgreSQL repositories, filesystem image storage, password hashing, bearer token generation/storage, guards, controllers, middleware, and HTTP request handling are real.

## Product Database Tables Exercised

The integration suite uses the existing migrated tables:

- `user_accounts`
- `bearer_tokens`
- `measurements`
- `measurement_images`
- `recognition_tasks`

**Cleanup rule**: Before each endpoint-level scenario, clear dependent rows in an order that respects foreign keys, or use a single `TRUNCATE ... RESTART IDENTITY CASCADE` statement for these tables.

## Relationships

- One npm test command selects one test suite category.
- One CI job runs one validation command.
- The unit/contract coverage CI job runs `npm run test:coverage`.
- The integration CI job prepares `.env.test` database state and runs `npm run test:integration`.
- One endpoint scenario maps to one endpoint outcome from `docs/openapi.yaml`.
- Endpoint scenarios operate on the real PostgreSQL tables through existing adapters.
