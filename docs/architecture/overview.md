# Architecture Overview

This document describes the high-level architecture of the project.

## Web server

The web server is a Node.js 24 / NestJS 11 application started by `src/api-main.ts` through the `npm run api` script. It creates `ApiModule`, selects Nest log levels from `NODE_ENV`, loads runtime API configuration, and listens on `API_PORT` (default `3000`). This section documents only the server-side web/API runtime; mobile application architecture can be added separately later.

The server has two inbound web surfaces in the same Nest module:

- Public HTML pages at `/` and `/policy`, implemented by `HomeController` and `PolicyController`. These render server-generated HTML with localized copy resolved from `Accept-Language` or a `lang` query parameter.
- Mobile API endpoints under `/api/v1`, implemented by `AuthController` and `MeasurementsController`. These provide account creation, login, authenticated image upload, measurement detail, image download, save confirmation, and paginated history.

`ApiModule` is the composition root for the server. It wires controllers, guards, middleware, the background recognition worker, application use cases, and concrete outbound adapters. Dependency injection binds application ports to adapters: user accounts, bearer tokens, measurements, and recognition tasks use Postgres repositories; original measurement images use the filesystem storage adapter plus `measurement_images` metadata in Postgres; passwords and bearer tokens use Node.js crypto adapters; recognition uses the OpenAI vision adapter through the LLM provider port.

The main mobile API request flow is:

1. `POST /api/v1/signin` and `POST /api/v1/login` pass through `AuthRateLimitGuard`, validate the request DTO, normalize email addresses, verify password policy or credentials, and issue opaque expiring bearer tokens. Raw bearer tokens are returned once and only token hashes are persisted.
2. Protected measurement routes pass through `BearerAuthGuard`, which extracts the `Authorization: Bearer <token>` header, validates the token hash and expiry, loads the user, and attaches authenticated user context to the request.
3. `POST /api/v1/measurements` accepts one multipart `image` file, limited to 10 MB by the Nest file interceptor. The application use case validates JPEG/PNG content, creates a pending measurement with server-assigned `measurementTime`, writes the original image through the image store, and creates a queued recognition task.
4. `RecognitionTaskWorker` runs on a configured interval, claims queued tasks from Postgres, loads the original image, moves measurements through `pending -> recognizing`, calls the LLM provider, then persists either recognized values and a completed task or a retry/failure state.
5. `GET /api/v1/measurements/<id>` and `GET /api/v1/measurements/<id>/image` load only measurements owned by the authenticated user. Detail responses include recognition state and an owner-protected image URL; image responses stream the original JPEG/PNG bytes with content headers.
6. `POST /api/v1/measurements/<id>/save` confirms a recognized owned measurement, optionally accepting corrected recognized values, and moves it into a saved state.
7. `GET /api/v1/measurements` returns paginated, time-filtered history from server-assigned measurement times. The current repository query includes owned `recognized` and `saved` records and never includes image binary data.

The durable data model is defined by `src/infrastructure/database/migrations/001_mobile_api.sql`. It contains `user_accounts`, `bearer_tokens`, `measurements`, `measurement_images`, and `recognition_tasks`, with indexes for token lookup/expiry, measurement history by user/status/time, and recognition task claiming by status/availability.

Errors are mapped to a consistent JSON shape by the HTTP error mapper. Domain and application code raise user-safe `ApiError` values; controllers translate them into `400`, `401`, `404`, or `409` responses. Authentication rate limiting returns `429` directly from the guard.

Operational logging is part of the web server boundary. `loadApiLoggingConfig` maps `NODE_ENV=production` to warn-or-higher Nest log levels and every other value to debug-capable development logging. `HttpRequestLoggingMiddleware` emits one JSON request/status log entry after each completed request, including method, path, status code, and duration. The log entry intentionally excludes request bodies, response bodies, authorization headers, cookies, passwords, multipart payloads, and image bytes.

Runtime configuration is read from environment variables and optional `.env` loading in `ApiConfigService`. Required runtime inputs include `DATABASE_URL`; server behavior also depends on `API_PORT`, `MEASUREMENT_IMAGE_DIR`, `ACCESS_TOKEN_TTL_SECONDS`, `RECOGNITION_WORKER_INTERVAL_SECONDS`, `RECOGNITION_WORKER_BATCH_SIZE`, `OPENAI_API_KEY`, provider/model settings used by the recognition adapter, and `NODE_ENV` for logging mode.

The web server architecture was introduced by spec 006 (`specs/006-mobile-bp-api`). Its artifacts define the product contract, data model, API contract, logging contract, and implementation task traceability for the server. `docs/openapi.yaml` is the published API contract artifact for HTTP clients.
