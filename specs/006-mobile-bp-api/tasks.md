# Tasks: Mobile BP API

**Input**: Design documents from `/specs/006-mobile-bp-api/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, contracts/logging.md, quickstart.md

**Tests**: Test tasks are REQUIRED. Every user story includes tests, existing tests are preserved unless justified by a requirement change, and CI coverage remains >= 95%.

**Organization**: Completed tasks retain traceability for the full mobile API specification; pending tasks add the logging increment clarified after the API implementation.

## Constitution Check

- [X] Hexagonal boundaries preserved with domain/application rules behind ports and HTTP/Postgres/filesystem/provider/logging concerns in adapters or bootstrap.
- [X] New unit, contract, and integration tests are planned or completed without rewriting existing CLI behavior for convenience.
- [X] Coverage gate is maintained at or above 95% globally, with changed feature areas targeted for full branch coverage where feasible.
- [X] Implementation uses local Node.js, npm, TypeScript, Jest, Postgres, filesystem tooling, and official NestJS APIs only.
- [X] Feature work is scoped to branch `006-mobile-bp-api` and worktree path `tmp/006-mobile-bp-api`.
- [X] Node.js 24.x and NestJS 11 baselines remain documented in plan/spec artifacts.
- [X] Dependency policy is respected: `pg` is justified for Postgres access and no third-party logging dependency is planned.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish API dependencies, bootstrap files, worktree isolation, and durable schema scaffolding used by all stories.

- [X] T001 Confirm or create feature worktree `tmp/006-mobile-bp-api` for implementation work
- [X] T002 Update API dependencies and npm scripts for Nest HTTP, Postgres, build, and API start commands in package.json
- [X] T003 [P] Add API environment configuration loader for DATABASE_URL, API_PORT, MEASUREMENT_IMAGE_DIR, and ACCESS_TOKEN_TTL_SECONDS in src/infrastructure/config/api-config.ts
- [X] T004 [P] Add HTTP server bootstrap entry point that starts Nest on API_PORT in src/api-main.ts
- [X] T005 Add API composition module wiring shared providers and future HTTP adapters in src/api.module.ts
- [X] T006 [P] Add Postgres schema migration for users, bearer tokens, measurements, measurement images, and recognition tasks in src/infrastructure/database/migrations/001_mobile_api.sql
- [X] T007 [P] Add mobile API test fixture image metadata/readme for JPEG/PNG upload tests in tests/fixtures/mobile-api/README.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain entities, policies, ports, and adapters that MUST be complete before any API user story can be implemented.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T008 [P] Create user account, bearer token, measurement, measurement image, and recognition task entities in src/domain/entities/
- [X] T009 [P] Implement email, password, measurement state, upload image, and pagination policies in src/domain/services/
- [X] T010 [P] Define user account, bearer token, password hasher, measurement, measurement image, and recognition task ports in src/application/ports/
- [X] T011 Implement Node crypto password hasher and bearer token adapters in src/adapters/outbound/crypto/
- [X] T012 Implement Postgres pool and repositories for users, tokens, measurements, and recognition tasks in src/adapters/outbound/postgres/
- [X] T013 [P] Implement filesystem measurement image storage adapter in src/adapters/outbound/filesystem/measurement-image-storage.adapter.ts
- [X] T014 Implement shared HTTP error response mapper in src/adapters/inbound/http/http-error.mapper.ts
- [X] T015 Implement bearer auth guard using token validation use case in src/adapters/inbound/http/bearer-auth.guard.ts
- [X] T016 Wire foundational API providers in src/api.module.ts

**Checkpoint**: Foundation ready - user story implementation can proceed.

---

## Phase 3: User Story 1 - Create Account With Email (Priority: P1) MVP

**Goal**: New mobile users can create an account with email/password and receive an expiring bearer access token.

**Independent Test**: Submit a valid email/password to `POST /api/v1/signin` and verify account creation, token response, duplicate rejection, and validation failures.

### Tests for User Story 1 (REQUIRED)

- [X] T017 [P] [US1] Add contract tests for `POST /api/v1/signin` success, invalid input, and duplicate email in tests/contract/mobile-api.contract.test.ts
- [X] T018 [P] [US1] Add unit tests for email normalization and duplicate account rules in tests/unit/domain/user-account.test.ts
- [X] T019 [P] [US1] Add unit tests for create account use case token issuance and password hashing in tests/unit/application/create-account.use-case.test.ts
- [X] T020 [P] [US1] Add integration test for signin persistence and bearer token response in tests/integration/mobile-api.integration.test.ts

### Implementation for User Story 1

- [X] T021 [US1] Implement create account use case in src/application/use-cases/create-account.use-case.ts
- [X] T022 [US1] Implement signin request and response DTOs in src/adapters/inbound/http/dto/auth.dto.ts
- [X] T023 [US1] Implement `POST /api/v1/signin` route in src/adapters/inbound/http/auth.controller.ts
- [X] T024 [US1] Wire create account use case and auth controller providers in src/api.module.ts

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Log In As Registered User (Priority: P1)

**Goal**: Registered users can log in with email/password and use a valid expiring bearer token for protected operations.

**Independent Test**: Create a user, log in with correct credentials, verify bearer token access, and confirm wrong credentials and missing/invalid tokens are rejected.

### Tests for User Story 2 (REQUIRED)

- [X] T025 [P] [US2] Add contract tests for `POST /api/v1/login` success and credential failures in tests/contract/mobile-api.contract.test.ts
- [X] T026 [P] [US2] Add unit tests for login use case credential validation and generic failure behavior in tests/unit/application/login-user.use-case.test.ts
- [X] T027 [P] [US2] Add unit tests for bearer token validation, expiry, and revocation behavior in tests/unit/application/authenticate-bearer-token.use-case.test.ts
- [X] T028 [P] [US2] Add integration test proving invalid bearer tokens cannot access protected measurement routes in tests/integration/mobile-api.integration.test.ts

### Implementation for User Story 2

- [X] T029 [US2] Implement login use case in src/application/use-cases/login-user.use-case.ts
- [X] T030 [US2] Implement bearer token authentication use case in src/application/use-cases/authenticate-bearer-token.use-case.ts
- [X] T031 [US2] Add `POST /api/v1/login` route to auth controller in src/adapters/inbound/http/auth.controller.ts
- [X] T032 [US2] Complete bearer auth guard token extraction and user context attachment in src/adapters/inbound/http/bearer-auth.guard.ts
- [X] T033 [US2] Wire login and bearer authentication providers in src/api.module.ts

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Submit Measurement Photo (Priority: P1)

**Goal**: Logged-in users can upload a JPEG/PNG image up to 10 MB, receive a measurement id and pending state, and schedule recognition in persisted background tasks.

**Independent Test**: Submit authenticated valid and invalid image uploads and verify storage, measurement creation, task creation, pending response, and no persistence on rejected uploads.

### Tests for User Story 3 (REQUIRED)

- [X] T034 [P] [US3] Add contract tests for `POST /api/v1/measurements` pending success and upload validation failures in tests/contract/mobile-api.contract.test.ts
- [X] T035 [P] [US3] Add unit tests for upload image policy covering JPEG, PNG, empty, oversized, and unsupported inputs in tests/unit/domain/upload-image-policy.test.ts
- [X] T036 [P] [US3] Add unit tests for submit measurement use case storage, server time, and task scheduling in tests/unit/application/submit-measurement-image.use-case.test.ts
- [X] T037 [P] [US3] Add integration test for authenticated upload persistence and task creation in tests/integration/mobile-api.integration.test.ts

### Implementation for User Story 3

- [X] T038 [US3] Implement submit measurement image use case in src/application/use-cases/submit-measurement-image.use-case.ts
- [X] T039 [US3] Implement measurement upload DTO and multipart mapping in src/adapters/inbound/http/dto/measurement.dto.ts
- [X] T040 [US3] Implement authenticated `POST /api/v1/measurements` route in src/adapters/inbound/http/measurements.controller.ts
- [X] T041 [US3] Wire measurement controller, upload use case, image storage, and task store providers in src/api.module.ts

**Checkpoint**: User Story 3 can be validated independently.

---

## Phase 6: User Story 4 - Review Recognition Result And Save (Priority: P2)

**Goal**: Users can retrieve measurement detail, see pending/recognized/failed/saved states with image links, retrieve original images, and explicitly save recognized measurements into history.

**Independent Test**: Drive a measurement through pending, recognized, failed, and saved states; verify detail/image responses, ownership protection, and save endpoint state rules.

### Tests for User Story 4 (REQUIRED)

- [X] T042 [P] [US4] Add contract tests for `GET /api/v1/measurements/<id>` pending, recognized, failed, and ownership cases in tests/contract/mobile-api.contract.test.ts
- [X] T043 [P] [US4] Add contract tests for `GET /api/v1/measurements/<id>/image` success and ownership cases in tests/contract/mobile-api.contract.test.ts
- [X] T044 [P] [US4] Add contract tests for `POST /api/v1/measurements/<id>/save` success, not-owned, and invalid-state cases in tests/contract/mobile-api.contract.test.ts
- [X] T045 [P] [US4] Add unit tests for measurement state policy recognition and save transitions in tests/unit/domain/measurement-state-policy.test.ts
- [X] T046 [P] [US4] Add unit tests for detail, image, save, and recognition task processing use cases in tests/unit/application/measurement-review.use-cases.test.ts
- [X] T047 [P] [US4] Add integration test for review, image retrieval, recognition result persistence, and save confirmation in tests/integration/mobile-api.integration.test.ts

### Implementation for User Story 4

- [X] T048 [US4] Implement get measurement detail use case in src/application/use-cases/get-measurement-detail.use-case.ts
- [X] T049 [US4] Implement get measurement image use case in src/application/use-cases/get-measurement-image.use-case.ts
- [X] T050 [US4] Implement save measurement use case in src/application/use-cases/save-measurement.use-case.ts
- [X] T051 [US4] Implement recognition task processing use case in src/application/use-cases/process-recognition-task.use-case.ts
- [X] T052 [US4] Add detail response DTO mapping in src/adapters/inbound/http/dto/measurement.dto.ts
- [X] T053 [US4] Add authenticated detail, image, and save routes to src/adapters/inbound/http/measurements.controller.ts
- [X] T054 [US4] Wire detail, image, save, and recognition processing providers in src/api.module.ts

**Checkpoint**: User Story 4 can be validated independently.

---

## Phase 7: User Story 5 - Browse Measurement History (Priority: P3)

**Goal**: Logged-in users can browse saved measurements in paginated pages filtered by server-assigned measurement time, with no image binary data in list responses.

**Independent Test**: Seed saved, pending, failed, unconfirmed, and cross-user measurements; request filtered pages and verify only the authenticated user's saved matches are returned with pagination metadata.

### Tests for User Story 5 (REQUIRED)

- [X] T055 [P] [US5] Add contract tests for `GET /api/v1/measurements` pagination, time filters, empty results, and invalid ranges in tests/contract/mobile-api.contract.test.ts
- [X] T056 [P] [US5] Add unit tests for pagination and time-range policy in tests/unit/domain/pagination-policy.test.ts
- [X] T057 [P] [US5] Add unit tests for list measurements use case filtering saved-only owned measurements in tests/unit/application/list-measurements.use-case.test.ts
- [X] T058 [P] [US5] Add integration test for history list excluding images, pending, failed, unconfirmed, and cross-user measurements in tests/integration/mobile-api.integration.test.ts

### Implementation for User Story 5

- [X] T059 [US5] Implement list measurements use case in src/application/use-cases/list-measurements.use-case.ts
- [X] T060 [US5] Add history query DTO and list response DTO mapping in src/adapters/inbound/http/dto/measurement.dto.ts
- [X] T061 [US5] Add authenticated `GET /api/v1/measurements` route to src/adapters/inbound/http/measurements.controller.ts
- [X] T062 [US5] Wire list measurements provider in src/api.module.ts

**Checkpoint**: User Story 5 can be validated independently.

---

## Phase 8: Completed API Polish & Cross-Cutting Concerns

**Purpose**: Documentation, security checks, regression validation, and coverage hardening across the implemented API.

- [X] T063 [P] Update README with mobile API setup, environment variables, and smoke flow in README.md
- [X] T064 [P] Add API environment examples without secrets in .env.example
- [X] T065 [P] Add API quickstart validation notes in specs/006-mobile-bp-api/quickstart.md
- [X] T066 Add regression test ensuring existing CLI help/predict/eval bootstrap remains unchanged in tests/integration/cli.integration.test.ts
- [X] T067 Run build validation with `npm run build` and fix issues in src/api-main.ts and src/api.module.ts
- [X] T068 Run full test coverage with `npm run test:coverage` and close coverage gaps in tests/unit/application/ and tests/unit/domain/
- [X] T069 Run lint validation with `npm run lint` and fix issues in src/ and tests/
- [X] T070 Review Postgres migration indexes and constraints for ownership, token expiry, and history filter performance in src/infrastructure/database/migrations/001_mobile_api.sql
- [ ] T071 Verify quickstart smoke commands work against the local API server and update specs/006-mobile-bp-api/quickstart.md if needed

   Note: deferred until a local PostgreSQL database is available for the API server; build, lint, contract, integration, and coverage validation passed in this workspace.

---

## Phase 9: Logging Foundation (Blocking Prerequisites)

**Purpose**: Core logging infrastructure required by FR-030, FR-031, FR-032, and SC-009.

**CRITICAL**: Endpoint-specific logging tests cannot pass until this phase is complete.

- [ ] T072 [P] Add unit tests for `NODE_ENV` logging mode selection in tests/unit/infrastructure/api-logging-config.test.ts
- [ ] T073 [P] Add unit tests for HTTP request log entry privacy exclusions in tests/unit/adapters/inbound/http/http-request-logging.test.ts
- [ ] T074 Implement logging level selection helper for production and development modes in src/infrastructure/config/api-logging-config.ts
- [ ] T075 Implement HTTP request/status logging middleware or interceptor in src/adapters/inbound/http/http-request-logging.ts
- [ ] T076 Configure Nest application logging with selected log levels in src/api-main.ts
- [ ] T077 Register HTTP request/status logging for all mobile API routes in src/api.module.ts
- [ ] T078 Ensure logging implementation excludes request bodies, response bodies, authorization headers, cookies, passwords, multipart payloads, image bytes, and health payloads in src/adapters/inbound/http/http-request-logging.ts

**Checkpoint**: Logging levels are selected from `NODE_ENV`, Nest logging is enabled, and all HTTP requests can emit privacy-safe debug request/status entries in development mode.

---

## Phase 10: Logging For User Story 1 - Create Account With Email (Priority: P1)

**Goal**: Account creation requests emit development debug logs with response status while avoiding credential leakage.

**Independent Test**: Submit valid and invalid `POST /api/v1/signin` requests in development logging mode and verify one debug entry per request with method/path/status and no password or request body data.

- [ ] T079 [P] [US1] Add contract test for development debug logging on successful `POST /api/v1/signin` in tests/contract/mobile-api-logging.contract.test.ts
- [ ] T080 [P] [US1] Add integration test proving signin debug logs omit password and request body data in tests/integration/mobile-api.integration.test.ts
- [ ] T081 [US1] Verify signin route logs method, path, and `201` status through shared HTTP logging in src/adapters/inbound/http/auth.controller.ts

---

## Phase 11: Logging For User Story 2 - Log In As Registered User (Priority: P1)

**Goal**: Login and protected-route authentication failures emit request/status logs without exposing credentials or bearer tokens.

**Independent Test**: Submit successful login, failed login, and missing/invalid bearer token requests in development mode; verify debug entries show actual statuses and no credentials or tokens.

- [ ] T082 [P] [US2] Add contract tests for debug logs on successful and failed `POST /api/v1/login` in tests/contract/mobile-api-logging.contract.test.ts
- [ ] T083 [P] [US2] Add integration test proving invalid bearer token debug logs omit the token value in tests/integration/mobile-api.integration.test.ts
- [ ] T084 [US2] Verify login and bearer guard request outcomes are captured by shared HTTP logging in src/adapters/inbound/http/auth.controller.ts and src/adapters/inbound/http/bearer-auth.guard.ts

---

## Phase 12: Logging For User Story 3 - Submit Measurement Photo (Priority: P1)

**Goal**: Measurement upload requests emit request/status logs without exposing multipart payloads or image bytes.

**Independent Test**: Submit valid and invalid authenticated image uploads in development mode and verify debug entries include method/path/status but exclude multipart content and image bytes.

- [ ] T085 [P] [US3] Add contract test for debug logging on successful `POST /api/v1/measurements` upload in tests/contract/mobile-api-logging.contract.test.ts
- [ ] T086 [P] [US3] Add integration test proving upload debug logs omit multipart payload and image bytes in tests/integration/mobile-api.integration.test.ts
- [ ] T087 [US3] Verify measurement upload request outcomes are captured by shared HTTP logging in src/adapters/inbound/http/measurements.controller.ts

---

## Phase 13: Logging For User Story 4 - Review Recognition Result And Save (Priority: P2)

**Goal**: Measurement detail, image retrieval, and save requests emit request/status logs for success and error statuses without exposing health data or image bytes.

**Independent Test**: Request measurement detail, original image, and save operations in development mode; verify debug logs contain statuses such as `200`, `201`, `404`, and `409` without response bodies, recognized readings, or image bytes.

- [ ] T088 [P] [US4] Add contract tests for debug logs on `GET /api/v1/measurements/<id>`, `GET /api/v1/measurements/<id>/image`, and `POST /api/v1/measurements/<id>/save` in tests/contract/mobile-api-logging.contract.test.ts
- [ ] T089 [P] [US4] Add integration test proving detail, image, and save debug logs omit response bodies, recognized readings, and image bytes in tests/integration/mobile-api.integration.test.ts
- [ ] T090 [US4] Verify detail, image, and save route outcomes are captured by shared HTTP logging in src/adapters/inbound/http/measurements.controller.ts

---

## Phase 14: Logging For User Story 5 - Browse Measurement History (Priority: P3)

**Goal**: Saved-history list requests emit request/status logs for successful, empty, and invalid-filter responses without logging health history payloads.

**Independent Test**: Request saved measurement history with valid and invalid filters in development mode and verify debug entries include method/path/status while excluding list response bodies.

- [ ] T091 [P] [US5] Add contract test for debug logging on `GET /api/v1/measurements` history requests in tests/contract/mobile-api-logging.contract.test.ts
- [ ] T092 [P] [US5] Add integration test proving history debug logs omit response item data and preserve `400` invalid-filter status logging in tests/integration/mobile-api.integration.test.ts
- [ ] T093 [US5] Verify history list route outcomes are captured by shared HTTP logging in src/adapters/inbound/http/measurements.controller.ts

---

## Phase 15: Production Logging Mode

**Purpose**: Cross-story production behavior required by FR-031 and SC-009.

- [ ] T094 [P] Add contract test proving `NODE_ENV=production` suppresses debug HTTP request logs in tests/contract/mobile-api-logging.contract.test.ts
- [ ] T095 [P] Add unit or contract test proving warn/error log levels remain enabled when `NODE_ENV=production` in tests/unit/infrastructure/api-logging-config.test.ts
- [ ] T096 Add integration test covering production logging mode for a representative mobile API request in tests/integration/mobile-api.integration.test.ts
- [ ] T097 Verify production logging level selection is wired through API bootstrap in src/api-main.ts

---

## Phase 16: Logging Polish & Validation

**Purpose**: Documentation, validation, and coverage hardening across logging behavior.

- [ ] T098 [P] Update README mobile API environment section with `NODE_ENV` logging behavior in README.md
- [ ] T099 [P] Update `.env.example` with optional `NODE_ENV=development` guidance in .env.example
- [ ] T100 [P] Update quickstart logging checks if implementation details differ from planned commands in specs/006-mobile-bp-api/quickstart.md
- [ ] T101 Run build validation with `npm run build` and fix TypeScript issues in src/api-main.ts, src/api.module.ts, src/infrastructure/config/api-logging-config.ts, and src/adapters/inbound/http/http-request-logging.ts
- [ ] T102 Run focused logging tests with `npm test -- mobile-api-logging` and fix failures in tests/contract/mobile-api-logging.contract.test.ts
- [ ] T103 Run mobile API integration tests with `npm test -- tests/integration/mobile-api.integration.test.ts` and fix logging-related failures in src/adapters/inbound/http/http-request-logging.ts
- [ ] T104 Run full coverage with `npm run test:coverage` and close coverage gaps in tests/unit/infrastructure/api-logging-config.test.ts and tests/unit/adapters/inbound/http/http-request-logging.test.ts
- [ ] T105 Run lint validation with `npm run lint` and fix issues in src/ and tests/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational API (Phase 2)**: Depends on Setup completion - blocks API user stories.
- **API User Stories (Phase 3-7)**: Depend on Foundational API completion.
- **Completed API Polish (Phase 8)**: Depends on API user stories.
- **Logging Foundation (Phase 9)**: Depends on current API bootstrap/module structure and blocks endpoint-specific logging tasks.
- **Logging User Stories (Phase 10-14)**: Depend on Logging Foundation and can be validated independently by endpoint group.
- **Production Logging Mode (Phase 15)**: Depends on Logging Foundation and can run alongside endpoint logging phases.
- **Logging Polish (Phase 16)**: Depends on desired logging coverage being complete.

### User Story Dependencies

- **US1 (P1)**: Can start after foundational API work; representative MVP for account creation and logging.
- **US2 (P1)**: Can start after foundational API work, but protected-route validation uses US1 token issuance.
- **US3 (P1)**: Depends on bearer authentication behavior from US2 for end-to-end validation.
- **US4 (P2)**: Depends on US3 measurement upload records and recognition tasks.
- **US5 (P3)**: Depends on US4 saved measurement state for realistic history results.
- **Logging phases**: Share one logging implementation and validate it across each endpoint group without changing domain/application business rules.

### Parallel Opportunities

- Setup tasks T003, T004, T006, and T007 can run in parallel after T001/T002 decisions are clear.
- Foundational entity, policy, and port tasks T008-T010 can run in parallel because they touch different files.
- Completed API tasks marked [P] document already parallelizable implementation/test work.
- Logging unit tests T072 and T073 can run in parallel.
- Logging contract tests T079, T082, T085, T088, and T091 can be drafted in parallel with coordination because they share tests/contract/mobile-api-logging.contract.test.ts.
- Logging integration tests T080, T083, T086, T089, and T092 can be drafted in parallel conceptually, but coordinate edits because they share tests/integration/mobile-api.integration.test.ts.
- Documentation tasks T098, T099, and T100 can run in parallel.

---

## Implementation Strategy

### MVP First

1. Preserve completed API baseline tasks T001-T071.
2. Complete Logging Foundation T072-T078.
3. Complete US1 logging tasks T079-T081.
4. Stop and validate signin debug logging independently.

### Incremental Delivery

1. Logging Foundation -> shared logging works.
2. US1 signin logging -> credentials are not logged.
3. US2 login/auth logging -> credentials and bearer tokens are not logged.
4. US3 upload logging -> multipart and image data are not logged.
5. US4 detail/image/save logging -> response bodies, readings, and image bytes are not logged.
6. US5 history logging -> list payloads are not logged.
7. Production logging validation -> debug logs are suppressed and warn/error levels remain enabled.
8. Documentation, build, focused tests, integration tests, full coverage, and lint.

## Notes

- [P] tasks = different files or independent scenarios; coordinate when multiple tasks edit the same test file.
- Completed `[X]` tasks document already implemented mobile API scope so active tasks still cover the full spec.
- Pending `[ ]` tasks define the logging increment.
- Do not log request bodies, response bodies, bearer tokens, passwords, multipart payloads, image bytes, recognized values, or health payloads.
- Keep logging out of domain/application business rules.
- Prefer official NestJS logger APIs and Node.js runtime configuration; do not add a third-party logging dependency unless a later plan explicitly justifies it.
- Keep CI coverage at or above 95% and target full coverage for changed logging branches.
- Keep implementation MCP-free and use local npm/Jest/TypeScript commands.
