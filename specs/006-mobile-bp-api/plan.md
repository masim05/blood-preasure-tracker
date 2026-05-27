# Implementation Plan: Mobile BP API

**Branch**: `006-mobile-bp-api` | **Date**: 2026-05-27 | **Spec**: [specs/006-mobile-bp-api/spec.md](specs/006-mobile-bp-api/spec.md)

**Input**: Feature specification from `/specs/006-mobile-bp-api/spec.md`

## Summary

Add a mobile HTTP API beside the existing CLI so users can create accounts, log in with expiring bearer tokens, upload JPEG/PNG measurement photos, review recognized systolic/diastolic/pulse/arm-side results, explicitly save recognized readings, and browse saved history. The implementation preserves the current hexagonal TypeScript/NestJS project by adding HTTP inbound adapters, application use cases, domain entities/services, Postgres-backed persistence adapters, server-side image storage, and persisted recognition task records that reuse the existing provider-backed image recognition port.

## Technical Context

**Language/Version**: TypeScript 5.8 on the latest active Node.js LTS, Node.js 24.x as of 2026-05-27

**Primary Dependencies**: NestJS 11, existing OpenAI SDK adapter for vitals recognition, planned official `@nestjs/platform-express` HTTP adapter, Node.js `crypto` for password hashing and opaque bearer token generation, Node.js filesystem APIs for local image storage, `pg` for PostgreSQL access behind outbound adapters, Jest 30 for tests

**Storage**: Latest supported PostgreSQL major for users, token hashes, measurements, image references, save confirmation state, and recognition task records; server filesystem storage for original JPEG/PNG images behind a storage port

**Testing**: Jest unit, contract, and integration tests; local validation through `npm run build`, `npm test`, `npm run test:coverage`, and `npm run lint`

**Target Platform**: Node.js HTTP API server for mobile clients on macOS/Linux developer machines and CI; existing local CLI remains supported

**Project Type**: Single-project TypeScript/NestJS application with CLI and HTTP API inbound adapters

**Performance Goals**: 95% of accepted image uploads return measurement id and pending status within 2 seconds under normal single-user use; history pages for up to 1,000 saved measurements return within 2 seconds

**Constraints**: Preserve existing CLI prediction/eval behavior; protect all measurement endpoints with valid expiring bearer tokens; accept only JPEG/PNG images up to 10 MB; assign measurement time from server current time at accepted upload; keep pending, failed, and unconfirmed recognized measurements out of default history; maintain CI coverage `>= 95%`; keep implementation MCP-free

**Scale/Scope**: First mobile API version for single-user/small-team local deployment scale, with histories up to 1,000 saved measurements per user and DB-backed recognition tasks instead of an external queue

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [X] **Hexagonal boundaries defined**: Account, auth, measurement ownership, recognition state, save confirmation, and history rules live in domain/application code; HTTP, Postgres, image filesystem, and provider details stay in adapters behind ports.
- [X] **Unit test strategy present**: Plan includes unit tests for account rules, credential/token behavior, upload validation, measurement ownership, recognition and save state transitions, pagination/time filters, and history exclusion rules.
- [X] **Coverage policy acknowledged**: CI gate remains `>= 95%`; changed feature areas target `100%` branch coverage for auth failures, upload validation, ownership checks, pending/recognized/saved/failed states, and time-filter boundaries where feasible.
- [X] **Additive test evolution respected**: Existing CLI tests should remain behaviorally unchanged; any shared bootstrap updates are additive and must preserve current CLI assertions.
- [X] **MCP-free implementation**: Plan uses repository scripts, npm, Jest, TypeScript, Node.js, Postgres, and local filesystem tooling only.
- [X] **Feature isolation via worktree**: Feature branch is `006-mobile-bp-api`; implementation worktree path is `tmp/006-mobile-bp-api`.
- [X] **Tech stack baseline**: Plan targets latest active Node.js LTS, Node.js 24.x as of 2026-05-27, and NestJS 11.
- [X] **Dependency policy**: Official Node.js/NestJS APIs are preferred; `pg` is justified because Node/Nest do not provide an official Postgres driver.

## Project Structure

### Documentation (this feature)

```text
specs/006-mobile-bp-api/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/
│   └── api.md           # Mobile HTTP API contract
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── adapters/
│   ├── inbound/
│   │   ├── cli/                         # existing CLI adapter remains unchanged
│   │   └── http/
│   │       ├── auth.controller.ts        # signin/login HTTP routes
│   │       ├── measurements.controller.ts # upload/list/detail/save routes
│   │       ├── bearer-auth.guard.ts      # bearer token extraction/validation
│   │       └── dto/                      # request/response DTO mapping and validation
│   └── outbound/
│       ├── filesystem/
│       │   └── measurement-image-storage.adapter.ts
│       ├── llm/                          # existing provider adapter reused for recognition
│       └── postgres/
│           ├── postgres-pool.ts
│           ├── user-account.repository.ts
│           ├── bearer-token.repository.ts
│           ├── measurement.repository.ts
│           └── recognition-task.repository.ts
├── application/
│   ├── ports/
│   │   ├── user-account-store.port.ts
│   │   ├── bearer-token-store.port.ts
│   │   ├── password-hasher.port.ts
│   │   ├── measurement-store.port.ts
│   │   ├── measurement-image-store.port.ts
│   │   └── recognition-task-store.port.ts
│   └── use-cases/
│       ├── create-account.use-case.ts
│       ├── login-user.use-case.ts
│       ├── authenticate-bearer-token.use-case.ts
│       ├── submit-measurement-image.use-case.ts
│       ├── get-measurement-detail.use-case.ts
│       ├── list-measurements.use-case.ts
│       ├── save-measurement.use-case.ts
│       └── process-recognition-task.use-case.ts
├── domain/
│   ├── entities/
│   │   ├── user-account.ts
│   │   ├── bearer-access-token.ts
│   │   ├── measurement.ts
│   │   ├── measurement-image.ts
│   │   └── recognition-task.ts
│   └── services/
│       ├── email-normalization.ts
│       ├── password-policy.ts
│       ├── measurement-state-policy.ts
│       ├── upload-image-policy.ts
│       └── pagination-policy.ts
├── infrastructure/
│   ├── config/
│   │   └── api-config.ts
│   └── database/
│       └── migrations/                   # Postgres schema setup when implemented
├── app.module.ts                         # shared provider module remains available
├── api.module.ts                         # HTTP API composition root
├── api-main.ts                           # HTTP server bootstrap
└── main.ts                               # existing CLI bootstrap remains available

tests/
├── contract/
│   └── mobile-api.contract.test.ts
├── integration/
│   └── mobile-api.integration.test.ts
└── unit/
    ├── adapters/
    ├── application/
    ├── domain/
    └── infrastructure/
```

**Structure Decision**: Keep the existing single-project layout and add HTTP as a sibling inbound adapter to the CLI. The feature adds new domain/application ports and Postgres/filesystem adapters while reusing the existing LLM provider adapter for recognition. This avoids a separate API project and keeps coverage, dependency injection, and hexagonal boundaries consistent with current code.

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

## Phase 1: Design Output

### Planned Port and Adapter Changes

- Add account and auth ports for user persistence, password hashing, bearer token persistence, and token validation.
- Add measurement ports for measurement persistence, original image storage, and recognition task persistence.
- Add HTTP inbound controllers for `POST /api/v1/signin`, `POST /api/v1/login`, `POST /api/v1/measurements`, `GET /api/v1/measurements`, `GET /api/v1/measurements/<id>`, and `POST /api/v1/measurements/<id>/save`.
- Add Postgres outbound adapters for user accounts, bearer token hashes, measurements, and recognition tasks.
- Add filesystem image storage adapter for original JPEG/PNG images, with access-controlled or time-limited image links.
- Add a recognition task processing use case that reuses the existing LLM provider port and persists recognized systolic, diastolic, pulse, and arm side values.
- Add API configuration for database URL, API port, image storage directory, and access-token TTL while preserving existing CLI configuration.

### Data Model

Detailed in [specs/006-mobile-bp-api/data-model.md](specs/006-mobile-bp-api/data-model.md). Core entities:

- `UserAccount`
- `BearerAccessToken`
- `Measurement`
- `MeasurementImage`
- `RecognitionTask`
- `MeasurementHistoryPage`

### Contracts

Detailed in [specs/006-mobile-bp-api/contracts/api.md](specs/006-mobile-bp-api/contracts/api.md). The contract defines the mobile API route shapes, bearer authentication expectations, upload constraints, measurement state responses, save confirmation, and history filtering behavior.

### Quickstart

Documented in [specs/006-mobile-bp-api/quickstart.md](specs/006-mobile-bp-api/quickstart.md), including expected environment variables, build/test commands, local database setup direction, and curl-based smoke checks for the full mobile flow.

## Post-Design Constitution Check

- [X] **Hexagonal boundaries defined**: Data model and contracts keep domain rules in application/domain code; HTTP, Postgres, filesystem, and provider concerns are adapters behind ports.
- [X] **Unit test strategy present**: Design identifies unit, contract, and integration coverage for auth, upload, ownership, recognition states, save confirmation, and history filters.
- [X] **Coverage policy acknowledged**: Coverage remains `>= 95%`, with changed auth/state/upload branches targeted for full branch coverage where feasible.
- [X] **Additive test evolution respected**: CLI behavior remains intact; mobile API tests are additive and any shared bootstrap changes must preserve existing CLI tests.
- [X] **MCP-free implementation**: Design relies on local npm/Jest/TypeScript, Node.js, Postgres, and filesystem workflows only.
- [X] **Feature isolation via worktree**: Implementation remains scoped to `tmp/006-mobile-bp-api` on branch `006-mobile-bp-api`.
- [X] **Tech stack baseline**: Node.js 24.x and NestJS 11 remain the baseline.
- [X] **Dependency policy**: `@nestjs/platform-express` is the official Nest HTTP platform; `pg` is the minimal justified Postgres dependency; password/token operations use Node.js built-ins.

## Complexity Tracking

No constitution violations are expected for this plan.
