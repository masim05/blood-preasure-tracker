# Contract: Integration Environment

## Tracked Test Environment

The repository must include `.env.test` with local, non-secret defaults for integration tests.

Required keys:

- `OPENAI_API_KEY`: Placeholder value; OpenAI calls are mocked.
- `CLI_PROVIDER`: Existing provider default, expected to remain `openai` unless product defaults change.
- `CLI_MODEL`: Existing model default used by config loading.
- `DATABASE_URL`: Local PostgreSQL test database connection string.
- `API_PORT`: Local test API port default.
- `MEASUREMENT_IMAGE_DIR`: Test-only image storage directory under `tmp/`.
- `ACCESS_TOKEN_TTL_SECONDS`: Positive integer token lifetime.
- `NODE_ENV`: Test/development value used by logging configuration.

## Database Setup

Before running mobile API integration tests, prepare the database with:

```bash
npm run db:init -- --env .env.test
```

Required behavior:

- The command creates or starts the Docker-backed local PostgreSQL database for `.env.test`.
- Migrations from `src/infrastructure/database/migrations` are applied.
- `npm run test:integration` uses the same `.env.test` database credentials.

## Isolation

Each endpoint-level mobile API integration scenario must reset relevant database state before setup.

Required behavior:

- Clear `recognition_tasks`, `measurement_images`, `measurements`, `bearer_tokens`, and `user_accounts` before each endpoint-level scenario.
- Preserve migrated schema and indexes.
- Do not depend on rows created by earlier scenarios.
- Do not rely on Jest execution order.

## Dependency Boundary

Mobile API integration tests must use real project infrastructure except OpenAI.

Real dependencies:

- PostgreSQL repositories
- PostgreSQL connection pool
- Filesystem measurement image storage
- Password hashing adapter
- Bearer token generator and store
- NestJS controllers, guards, middleware, and use cases
- HTTP request/response handling through the Nest application

Mocked dependency:

- OpenAI/LLM provider only, with deterministic responses for recognition scenarios.

## Endpoint Describe Names

Every endpoint-level `describe` block in mobile API integration tests must use:

```text
<METHOD> <path> - <scenario>
```

Examples:

- `POST /api/v1/signin - happy path`
- `POST /api/v1/signin - email already taken`
- `GET /api/v1/measurements/{id} - not found`

## OpenAPI 4xx Coverage

Mobile API integration tests must cover every documented 4xx response for implemented mobile API endpoints in `docs/openapi.yaml`:

- `POST /api/v1/signin`: 400, 409, 429
- `POST /api/v1/login`: 400, 401, 429
- `POST /api/v1/measurements`: 400, 401
- `GET /api/v1/measurements`: 400, 401
- `GET /api/v1/measurements/{id}`: 401, 404
- `POST /api/v1/measurements/{id}/save`: 401, 404, 409
- `GET /api/v1/measurements/{id}/image`: 401, 404

Each negative-path scenario must assert both the documented status code and the documented error response shape when the response body is JSON.
