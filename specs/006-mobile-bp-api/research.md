# Phase 0 Research: Mobile BP API

## Decision: Keep the repository as a single NestJS TypeScript project

**Rationale**: The current codebase already uses a single NestJS application module with hexagonal folders under `src/` and Jest coverage under `tests/`. Adding a mobile HTTP API as another inbound adapter preserves shared domain logic, existing provider adapters, and current build/test commands.

**Alternatives considered**: A separate `api/` project was rejected because it would duplicate module wiring and complicate coverage for a feature that can fit the existing architecture. A mobile client implementation was rejected because the requested scope is the server API used by the mobile app.

## Decision: Use opaque expiring bearer access tokens

**Rationale**: The clarified auth contract requires signin/login to return an expiring bearer token. Opaque random tokens generated with `node:crypto`, stored only as hashes with an expiry timestamp in Postgres, allow revocation and validation without adding JWT-specific complexity. This keeps token behavior behind application ports and makes tests deterministic.

**Alternatives considered**: JWTs were rejected for the first version because they add signing/key rotation concerns and are harder to revoke before expiry. Cookie sessions were rejected because a mobile API is more naturally served by bearer tokens. Long-lived API tokens were rejected because the clarification requires expiring access tokens.

## Decision: Use PostgreSQL through a persistence adapter backed by `pg`

**Rationale**: The feature requires durable users, credential data, measurements, image references, save state, and persisted recognition tasks. Node.js and NestJS do not provide an official Postgres driver; `pg` is the standard maintained low-level driver and can stay isolated in outbound adapters behind ports.

**Alternatives considered**: An ORM was rejected for the first implementation because the domain model is small and direct SQL is enough behind ports. In-memory storage was rejected because the spec requires durable Postgres storage. SQLite was rejected because the requested DB is Postgres.

## Decision: Target latest supported PostgreSQL major in deployment

**Rationale**: PostgreSQL does not brand a separate LTS edition; supported stable major releases receive long maintenance windows. The implementation should target the latest supported PostgreSQL major available in the deployment environment and document the exact image/version used in quickstart and CI once implementation begins.

**Alternatives considered**: Pinning an older major was rejected because it conflicts with the requested latest LTS-style Postgres baseline. Leaving the version unspecified was rejected because migration and local setup need a concrete supported major during implementation.

## Decision: Store uploaded images on the server filesystem behind an image storage port

**Rationale**: The requirement says the server stores images and returns links to originals. Local server-side storage keeps the first implementation simple, testable, and MCP-free while preserving a port boundary for future object storage. Stored files can be referenced from Postgres measurement records.

**Alternatives considered**: Storing image binaries directly in Postgres was rejected because it complicates list/detail queries and database backups. External object storage was rejected for the first version because it adds operational dependencies not requested by the spec.

## Decision: Represent recognition background work as persisted task records

**Rationale**: The spec explicitly allows managing background tasks in the DB for now. A `recognition_tasks` table with pending, processing, completed, and failed states is enough to schedule and recover work while keeping queue logic behind an application port.

**Alternatives considered**: A dedicated job queue was rejected for the first implementation because it adds a new service dependency. Synchronous recognition during upload was rejected because upload responses must quickly return a measurement id and pending state.

## Decision: Reuse the existing OpenAI vision extraction path for recognition

**Rationale**: The repository already has a provider-backed vitals extraction adapter that recognizes systolic, diastolic, pulse, arm side, and related metadata. The mobile API can schedule recognition work that reuses the same provider-facing port while writing results to measurement persistence.

**Alternatives considered**: A new recognition provider abstraction was rejected because the existing `LlmProviderPort` already captures image-to-reading extraction. Manual OCR parsing was rejected because the current project already delegates recognition to an LLM provider.

## Decision: Validate uploads as JPEG/PNG up to 10 MB before persistence

**Rationale**: The clarified requirement sets accepted formats and size. Validation should happen in the inbound HTTP adapter/application request handling before image storage, measurement creation, or task scheduling so rejected uploads leave no persisted measurement.

**Alternatives considered**: Accepting all image MIME types was rejected because the spec narrows support to JPEG/PNG. Post-storage validation was rejected because failures would require cleanup and could leave orphaned images.

## Decision: Use server-assigned measurement time

**Rationale**: The clarification says time is now. Assigning measurement time when the image is accepted creates a deterministic filter field and avoids relying on EXIF or provider recognition for mobile history ordering.

**Alternatives considered**: Extracting image metadata time was rejected by clarification. Letting users enter measurement time was rejected because manual entry is out of scope for the fast photo workflow.

## Decision: Use official NestJS logging for API runtime logs

**Rationale**: The clarified requirement needs environment-based log levels and debug HTTP request/status logs, not advanced log routing or external aggregation. NestJS already provides configurable log levels and logger integration, and a small HTTP middleware or interceptor can emit request completion records without adding dependencies or crossing domain boundaries.

**Alternatives considered**: A third-party structured logger was rejected because the current requirement can be satisfied with official NestJS/Node.js facilities and the constitution prefers official modules. Persisting logs in PostgreSQL was rejected because logs are operational output, not mobile API domain data. Logging inside controllers/use cases was rejected because it would duplicate cross-cutting HTTP behavior and leak transport concerns into application flows.

## Decision: Derive logging mode solely from `NODE_ENV`

**Rationale**: The clarification defines production as `NODE_ENV=production` and development as any other value or an unset value. Keeping this mapping in one bootstrap/config helper makes behavior explicit, testable, and consistent across local development, tests, and deployed runtime.

**Alternatives considered**: Adding a separate `LOG_LEVEL` override was rejected because it is not specified and could weaken the explicit dev/prod requirement. Treating `NODE_ENV=test` as production-like was rejected because the clarification says only `production` selects production logging.

## Decision: Log minimal HTTP metadata at debug level

**Rationale**: Debug request logs should prove each HTTP request completed and show the response status while protecting health-related content and credentials. Method, path or URL, response status, and elapsed time are enough for development troubleshooting without recording bodies, bearer tokens, passwords, multipart payloads, or image bytes.

**Alternatives considered**: Full request/response logging was rejected because it would expose sensitive credentials, health data, and uploaded images. Logging only failed requests was rejected because the requirement says every HTTP request should be logged at debug level in development. Access-log persistence was rejected because no durable audit log is requested.
