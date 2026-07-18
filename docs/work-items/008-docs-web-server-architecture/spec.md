# Web Server Architecture Documentation Spec

## Task

Document the current web server architecture in `docs/architecture` using the implemented server code and spec 006 artifacts as sources.

## Scope

- Add a `Web server` section to the architecture overview.
- Add web-server-specific dependency and module boundary rules.
- Add the web server source and artifact layout to project structure documentation.

## Out of Scope

- Mobile app architecture.
- Product code, tests, infrastructure behavior, CI behavior, and runtime configuration changes.
- New API endpoints or OpenAPI contract changes.

## Source Artifacts

- `specs/006-mobile-bp-api/spec.md`
- `specs/006-mobile-bp-api/plan.md`
- `specs/006-mobile-bp-api/data-model.md`
- `specs/006-mobile-bp-api/contracts/api.md`
- `specs/006-mobile-bp-api/contracts/logging.md`
- Implemented server code under `src/api-main.ts`, `src/api.module.ts`, `src/adapters/inbound/http/`, `src/adapters/inbound/worker/`, `src/application/`, `src/domain/`, `src/adapters/outbound/`, and `src/infrastructure/database/migrations/001_mobile_api.sql`.

## Acceptance Criteria

- Architecture documentation describes the implemented NestJS web server, mobile API, public HTML pages, data flow, runtime configuration, logging, persistence, storage, recognition worker, and external dependencies.
- Boundary documentation states where server business rules, framework code, and external side effects belong.
- Project structure documentation lists the server source directories and related artifacts.
- The documentation explicitly leaves mobile app architecture out of scope for a later section.