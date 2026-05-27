# Implementation Plan: Mobile BP API

**Branch**: `006-mobile-bp-api` | **Date**: 2026-05-27 | **Spec**: [specs/006-mobile-bp-api/spec.md](specs/006-mobile-bp-api/spec.md)

**Input**: Feature specification from `/specs/006-mobile-bp-api/spec.md`

## Summary

Add a mobile HTTP API beside the existing CLI so users can create accounts, log in with expiring bearer tokens, upload JPEG/PNG measurement photos, review recognized systolic/diastolic/pulse/arm-side results, explicitly save recognized readings, and browse saved history. The current increment extends that implemented API with application logging: `NODE_ENV=production` selects warn-or-higher production logging, every other `NODE_ENV` value selects debug-capable development logging, and development mode logs every HTTP request with response status without recording request/response bodies, bearer tokens, passwords, multipart payloads, image bytes, or health payloads.

## Technical Context

**Language/Version**: TypeScript 5.8 on the latest active Node.js LTS, Node.js 24.x as of 2026-05-27

**Primary Dependencies**: NestJS 11, `@nestjs/platform-express` HTTP adapter, existing OpenAI SDK adapter for vitals recognition, Node.js `crypto` for password hashing and opaque bearer token generation, Node.js filesystem APIs for local image storage, `pg` for PostgreSQL access behind outbound adapters, official NestJS logger APIs for application logging, Jest 30 for tests

**Storage**: Latest supported PostgreSQL major for users, token hashes, measurements, image references, save confirmation state, and recognition task records; server filesystem storage for original JPEG/PNG images behind a storage port; application logs emit to the runtime logger/process output and are not persisted by this feature

**Testing**: Jest unit, contract, and integration tests; local validation through `npm run build`, `npm test`, `npm run test:coverage`, and `npm run lint`

**Target Platform**: Node.js HTTP API server for mobile clients on macOS/Linux developer machines and CI; existing local CLI remains supported

**Project Type**: Single-project TypeScript/NestJS application with CLI and HTTP API inbound adapters

**Performance Goals**: 95% of accepted image uploads return measurement id and pending status within 2 seconds under normal single-user use; history pages for up to 1,000 saved measurements return within 2 seconds; request logging adds negligible per-request overhead

**Constraints**: Preserve existing CLI prediction/eval behavior; protect all measurement endpoints with valid expiring bearer tokens; accept only JPEG/PNG images up to 10 MB; assign measurement time from server current time at accepted upload; keep pending, failed, and unconfirmed recognized measurements out of default history; `NODE_ENV=production` suppresses debug HTTP request logs while keeping warn-or-higher logs enabled; maintain CI coverage `>= 95%`; keep implementation MCP-free

**Scale/Scope**: First mobile API version for single-user/small-team local deployment scale, with histories up to 1,000 saved measurements per user, DB-backed recognition tasks instead of an external queue, and runtime HTTP observability for development and production modes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [X] **Hexagonal boundaries defined**: Account, auth, measurement ownership, recognition state, save confirmation, and history rules live in domain/application code; HTTP, Postgres, image filesystem, provider, and logging details stay in adapters/bootstrap behind ports or framework boundaries.
- [X] **Unit test strategy present**: Plan includes unit tests for account rules, credential/token behavior, upload validation, measurement ownership, recognition and save state transitions, pagination/time filters, history exclusion rules, logging level selection, and privacy-safe request log formatting.
- [X] **Coverage policy acknowledged**: CI gate remains `>= 95%`; changed feature areas target `100%` branch coverage for auth failures, upload validation, ownership checks, pending/recognized/saved/failed states, time-filter boundaries, and logging mode branches where feasible.
- [X] **Additive test evolution respected**: Existing CLI tests remain behaviorally unchanged; mobile API and logging tests are additive except where a documented requirement change demands updates.
- [X] **MCP-free implementation**: Plan uses repository scripts, npm, Jest, TypeScript, Node.js, Postgres, local filesystem tooling, and official NestJS APIs only.
- [X] **Feature isolation via worktree**: Feature branch is `006-mobile-bp-api`; implementation worktree path is `tmp/006-mobile-bp-api`.
- [X] **Tech stack baseline**: Plan targets latest active Node.js LTS, Node.js 24.x as of 2026-05-27, and NestJS 11.
- [X] **Dependency policy**: Official Node.js/NestJS APIs are preferred; `pg` is justified because Node/Nest do not provide an official Postgres driver; no third-party logging dependency is planned.

## Project Structure

### Documentation (this feature)

```text
specs/006-mobile-bp-api/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api.md
│   └── logging.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── adapters/
│   ├── inbound/
│   │   ├── cli/                              # existing CLI adapter remains unchanged
│   │   └── http/
│   │       ├── auth.controller.ts            # signin/login HTTP routes
│   │       ├── measurements.controller.ts    # upload/list/detail/image/save routes
│   │       ├── bearer-auth.guard.ts          # bearer token extraction/validation
│   │       ├── http-request-logging.ts       # planned request/status logging adapter
│   │       └── dto/
│   └── outbound/
│       ├── crypto/
│       ├── filesystem/
│       ├── llm/
│       └── postgres/
├── application/
│   ├── ports/
│   └── use-cases/
├── domain/
│   ├── entities/
│   └── services/
├── infrastructure/
│   ├── config/
│   │   ├── api-config.ts
│   │   └── api-logging-config.ts             # planned NODE_ENV -> log-level mapping
│   └── database/
│       └── migrations/
├── api.module.ts
├── api-main.ts
└── main.ts

tests/
├── contract/
│   ├── mobile-api.contract.test.ts
│   └── mobile-api-logging.contract.test.ts
├── integration/
│   ├── cli.integration.test.ts
│   └── mobile-api.integration.test.ts
└── unit/
    ├── adapters/
    ├── application/
    ├── domain/
    └── infrastructure/
```

**Structure Decision**: Keep the existing single-project layout and add HTTP as a sibling inbound adapter to the CLI. The feature uses domain/application ports and Postgres/filesystem adapters for API behavior, reuses the existing LLM provider adapter for recognition, and adds logging only in API bootstrap/inbound HTTP infrastructure so domain/application rules remain transport-agnostic.

## Phase 0: Research Output

Research completed in [specs/006-mobile-bp-api/research.md](specs/006-mobile-bp-api/research.md). Key outcomes:

- Keep one NestJS/TypeScript project with CLI and HTTP inbound adapters.
- Use opaque expiring bearer tokens generated and hashed with Node.js crypto rather than JWTs or cookies.
- Use `pg` directly behind Postgres outbound adapters; no ORM is needed for the first data model.
- Target the latest supported PostgreSQL major in deployment because Postgres does not brand a separate LTS edition.
- Store original JPEG/PNG images on the server filesystem behind an image storage port.
- Represent background recognition as persisted DB task records before adding an external queue.
- Reuse the existing provider-backed recognition port for extracting blood pressure readings.
- Validate JPEG/PNG uploads up to 10 MB before creating measurement records or recognition tasks.
- Use official NestJS logging facilities and a small HTTP request logging adapter instead of a third-party logger.
- Derive logging mode solely from `NODE_ENV`, where only `production` selects production behavior.
- Log minimal HTTP metadata at debug level and exclude sensitive request, response, credential, multipart, image, and health payload data.

## Phase 1: Design Output

### Planned Port and Adapter Changes

- Add account and auth ports for user persistence, password hashing, bearer token persistence, and token validation.
- Add measurement ports for measurement persistence, original image storage, and recognition task persistence.
- Add HTTP inbound controllers for `POST /api/v1/signin`, `POST /api/v1/login`, `POST /api/v1/measurements`, `GET /api/v1/measurements`, `GET /api/v1/measurements/<id>`, `GET /api/v1/measurements/<id>/image`, and `POST /api/v1/measurements/<id>/save`.
- Add Postgres outbound adapters for user accounts, bearer token hashes, measurements, and recognition tasks.
- Add filesystem image storage adapter for original JPEG/PNG images, with owner-protected image retrieval.
- Add a recognition task processing use case that reuses the existing LLM provider port and persists recognized systolic, diastolic, pulse, and arm side values.
- Add API configuration for database URL, API port, image storage directory, and access-token TTL while preserving existing CLI configuration.
- Add `src/infrastructure/config/api-logging-config.ts` to map `NODE_ENV` to effective NestJS log levels.
- Configure `src/api-main.ts` to enable Nest application logging with selected levels instead of `logger: false`.
- Add `src/adapters/inbound/http/http-request-logging.ts` to log every completed HTTP request at debug level with method, path, response status, and elapsed time.
- Wire request/status logging through `src/api.module.ts` or bootstrap without changing domain/application ports.

### Data Model

Detailed in [specs/006-mobile-bp-api/data-model.md](specs/006-mobile-bp-api/data-model.md). Core entities and operational models:

- `UserAccount`
- `BearerAccessToken`
- `Measurement`
- `MeasurementImage`
- `RecognitionTask`
- `MeasurementHistoryPage`
- `RuntimeLoggingConfiguration`
- `HttpRequestLogEntry`
- `ApplicationLogSink`

### Contracts

Detailed in [specs/006-mobile-bp-api/contracts/api.md](specs/006-mobile-bp-api/contracts/api.md) and [specs/006-mobile-bp-api/contracts/logging.md](specs/006-mobile-bp-api/contracts/logging.md). The API contract defines route shapes, bearer authentication, upload constraints, measurement state responses, save confirmation, image retrieval, and history filtering. The logging contract defines runtime mode selection, minimum request/status log fields, production debug suppression, warn-or-higher production behavior, and privacy exclusions.

### Quickstart

Documented in [specs/006-mobile-bp-api/quickstart.md](specs/006-mobile-bp-api/quickstart.md), including expected environment variables, build/test commands, local database helper usage, curl-based smoke checks for the full mobile flow, and logging checks for development and production modes.

## Post-Design Constitution Check

- [X] **Hexagonal boundaries defined**: Data model and contracts keep domain rules in application/domain code; HTTP, Postgres, filesystem, provider, and logging concerns are adapters/bootstrap infrastructure.
- [X] **Unit test strategy present**: Design identifies unit, contract, and integration coverage for auth, upload, ownership, recognition states, save confirmation, history filters, logging level selection, request/status logging, production suppression, warn-or-higher production behavior, and sensitive-data exclusion.
- [X] **Coverage policy acknowledged**: Coverage remains `>= 95%`, with changed API and logging branches targeted for full coverage where feasible.
- [X] **Additive test evolution respected**: Existing CLI behavior remains preserved; logging tests are additive to the implemented mobile API behavior.
- [X] **MCP-free implementation**: Design relies on local npm/Jest/TypeScript workflow, Node.js, Postgres, local filesystem, and official NestJS APIs only.
- [X] **Feature isolation via worktree**: Implementation remains scoped to branch `006-mobile-bp-api` and worktree path `tmp/006-mobile-bp-api`.
- [X] **Tech stack baseline**: Node.js 24.x and NestJS 11 remain the baseline.
- [X] **Dependency policy**: `pg` remains the only non-official infrastructure exception for Postgres access; logging uses official NestJS/Node.js capabilities.

## Complexity Tracking

No constitution violations are expected for this plan.
