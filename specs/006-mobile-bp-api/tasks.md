# Tasks: Mobile BP API

**Input**: Design documents from `/specs/006-mobile-bp-api/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Test tasks are REQUIRED. Every user story includes new tests, preserves existing tests unless justified, and maintains CI coverage >= 95%.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Constitution Check

- [X] Hexagonal boundaries preserved with domain/application rules behind ports and HTTP/Postgres/filesystem/provider logic in adapters.
- [X] New unit, contract, and integration tests added for feature behavior without rewriting existing CLI tests.
- [X] Coverage gate maintained at or above 95% globally.
- [X] Implementation uses local Node.js, npm, TypeScript, Jest, and filesystem tooling only.
- [X] Node.js 24.x and NestJS 11 baselines remain documented in plan/spec artifacts.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish API dependencies, bootstrap files, and durable schema scaffolding used by all stories.

- [X] T001 Update API dependencies and npm scripts for Nest HTTP, Postgres, build, and API start commands in package.json
- [X] T002 [P] Add API environment configuration loader for DATABASE_URL, API_PORT, MEASUREMENT_IMAGE_DIR, and ACCESS_TOKEN_TTL_SECONDS in src/infrastructure/config/api-config.ts
- [X] T003 [P] Add HTTP server bootstrap entry point that starts Nest on API_PORT in src/api-main.ts
- [X] T004 Add API composition module wiring shared providers and future HTTP adapters in src/api.module.ts
- [X] T005 [P] Add Postgres schema migration for users, bearer tokens, measurements, measurement images, and recognition tasks in src/infrastructure/database/migrations/001_mobile_api.sql
- [X] T006 [P] Add mobile API test fixture image metadata/readme for JPEG/PNG upload tests in tests/fixtures/mobile-api/README.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain entities, policies, ports, and adapters that MUST be complete before ANY user story can be implemented.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T007 [P] Create user account domain entity in src/domain/entities/user-account.ts
- [X] T008 [P] Create bearer access token domain entity in src/domain/entities/bearer-access-token.ts
- [X] T009 [P] Create measurement domain entity with pending, recognizing, recognized, saved, and failed states in src/domain/entities/measurement.ts
- [X] T010 [P] Create measurement image domain entity in src/domain/entities/measurement-image.ts
- [X] T011 [P] Create recognition task domain entity in src/domain/entities/recognition-task.ts
- [X] T012 [P] Implement email normalization policy in src/domain/services/email-normalization.ts
- [X] T013 [P] Implement password validation and hashing policy interface helpers in src/domain/services/password-policy.ts
- [X] T014 [P] Implement measurement state transition policy in src/domain/services/measurement-state-policy.ts
- [X] T015 [P] Implement JPEG/PNG 10 MB upload validation policy in src/domain/services/upload-image-policy.ts
- [X] T016 [P] Implement pagination and time-range validation policy in src/domain/services/pagination-policy.ts
- [X] T017 [P] Define user account persistence port in src/application/ports/user-account-store.port.ts
- [X] T018 [P] Define bearer token persistence port in src/application/ports/bearer-token-store.port.ts
- [X] T019 [P] Define password hasher port in src/application/ports/password-hasher.port.ts
- [X] T020 [P] Define measurement persistence port in src/application/ports/measurement-store.port.ts
- [X] T021 [P] Define measurement image storage port in src/application/ports/measurement-image-store.port.ts
- [X] T022 [P] Define recognition task persistence port in src/application/ports/recognition-task-store.port.ts
- [X] T023 Implement Node crypto password hasher adapter in src/adapters/outbound/crypto/node-password-hasher.adapter.ts
- [X] T024 Implement Node crypto bearer token generator adapter in src/adapters/outbound/crypto/node-bearer-token.adapter.ts
- [X] T025 Implement Postgres connection pool adapter in src/adapters/outbound/postgres/postgres-pool.ts
- [X] T026 [P] Implement Postgres user account repository in src/adapters/outbound/postgres/user-account.repository.ts
- [X] T027 [P] Implement Postgres bearer token repository in src/adapters/outbound/postgres/bearer-token.repository.ts
- [X] T028 [P] Implement Postgres measurement repository in src/adapters/outbound/postgres/measurement.repository.ts
- [X] T029 [P] Implement Postgres recognition task repository in src/adapters/outbound/postgres/recognition-task.repository.ts
- [X] T030 [P] Implement filesystem measurement image storage adapter in src/adapters/outbound/filesystem/measurement-image-storage.adapter.ts
- [X] T031 Implement shared HTTP error response mapper in src/adapters/inbound/http/http-error.mapper.ts
- [X] T032 Implement bearer auth guard skeleton using token validation use case in src/adapters/inbound/http/bearer-auth.guard.ts
- [X] T033 Wire foundational API providers in src/api.module.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Create Account With Email (Priority: P1) MVP

**Goal**: New mobile users can create an account with email/password and receive an expiring bearer access token.

**Independent Test**: Submit a valid email/password to `POST /api/v1/signin` and verify account creation, token response, duplicate rejection, and validation failures.

### Tests for User Story 1 (REQUIRED)

- [X] T034 [P] [US1] Add contract tests for `POST /api/v1/signin` success, invalid input, and duplicate email in tests/contract/mobile-api.contract.test.ts
- [X] T035 [P] [US1] Add unit tests for email normalization and duplicate account rules in tests/unit/domain/user-account.test.ts
- [X] T036 [P] [US1] Add unit tests for create account use case token issuance and password hashing in tests/unit/application/create-account.use-case.test.ts
- [X] T037 [P] [US1] Add integration test for signin persistence and bearer token response in tests/integration/mobile-api.integration.test.ts

### Implementation for User Story 1

- [X] T038 [US1] Implement create account use case in src/application/use-cases/create-account.use-case.ts
- [X] T039 [US1] Implement signin request and response DTOs in src/adapters/inbound/http/dto/auth.dto.ts
- [X] T040 [US1] Implement `POST /api/v1/signin` route in src/adapters/inbound/http/auth.controller.ts
- [X] T041 [US1] Wire create account use case and auth controller providers in src/api.module.ts

**Checkpoint**: User Story 1 is independently functional and testable as the MVP account creation flow.

---

## Phase 4: User Story 2 - Log In As Registered User (Priority: P1)

**Goal**: Registered users can log in with email/password and use a valid expiring bearer token for protected operations.

**Independent Test**: Create a user, log in with correct credentials, verify bearer token access, and confirm wrong credentials and missing/invalid tokens are rejected.

### Tests for User Story 2 (REQUIRED)

- [X] T042 [P] [US2] Add contract tests for `POST /api/v1/login` success and credential failures in tests/contract/mobile-api.contract.test.ts
- [X] T043 [P] [US2] Add unit tests for login use case credential validation and generic failure behavior in tests/unit/application/login-user.use-case.test.ts
- [X] T044 [P] [US2] Add unit tests for bearer token validation, expiry, and revocation behavior in tests/unit/application/authenticate-bearer-token.use-case.test.ts
- [X] T045 [P] [US2] Add integration test proving invalid bearer tokens cannot access protected measurement routes in tests/integration/mobile-api.integration.test.ts

### Implementation for User Story 2

- [X] T046 [US2] Implement login use case in src/application/use-cases/login-user.use-case.ts
- [X] T047 [US2] Implement bearer token authentication use case in src/application/use-cases/authenticate-bearer-token.use-case.ts
- [X] T048 [US2] Add `POST /api/v1/login` route to auth controller in src/adapters/inbound/http/auth.controller.ts
- [X] T049 [US2] Complete bearer auth guard token extraction and user context attachment in src/adapters/inbound/http/bearer-auth.guard.ts
- [X] T050 [US2] Wire login and bearer authentication providers in src/api.module.ts

**Checkpoint**: User Stories 1 and 2 both work independently and protected routes have concrete authentication behavior.

---

## Phase 5: User Story 3 - Submit Measurement Photo (Priority: P1)

**Goal**: Logged-in users can upload a JPEG/PNG image up to 10 MB, receive a measurement id and pending state, and schedule recognition in persisted background tasks.

**Independent Test**: Submit authenticated valid and invalid image uploads and verify storage, measurement creation, task creation, pending response, and no persistence on rejected uploads.

### Tests for User Story 3 (REQUIRED)

- [X] T051 [P] [US3] Add contract tests for `POST /api/v1/measurements` pending success and upload validation failures in tests/contract/mobile-api.contract.test.ts
- [X] T052 [P] [US3] Add unit tests for upload image policy covering JPEG, PNG, empty, oversized, and unsupported inputs in tests/unit/domain/upload-image-policy.test.ts
- [X] T053 [P] [US3] Add unit tests for submit measurement use case storage, server time, and task scheduling in tests/unit/application/submit-measurement-image.use-case.test.ts
- [X] T054 [P] [US3] Add integration test for authenticated upload persistence and task creation in tests/integration/mobile-api.integration.test.ts

### Implementation for User Story 3

- [X] T055 [US3] Implement submit measurement image use case in src/application/use-cases/submit-measurement-image.use-case.ts
- [X] T056 [US3] Implement measurement upload DTO and multipart mapping in src/adapters/inbound/http/dto/measurement.dto.ts
- [X] T057 [US3] Implement authenticated `POST /api/v1/measurements` route in src/adapters/inbound/http/measurements.controller.ts
- [X] T058 [US3] Wire measurement controller, upload use case, image storage, and task store providers in src/api.module.ts

**Checkpoint**: User Story 3 can be validated independently with an authenticated upload producing a pending measurement.

---

## Phase 6: User Story 4 - Review Recognition Result And Save (Priority: P2)

**Goal**: Users can retrieve measurement detail, see pending/recognized/failed/saved states with image links, and explicitly save recognized measurements into history.

**Independent Test**: Drive a measurement through pending, recognized, failed, and saved states; verify detail responses, ownership protection, and save endpoint state rules.

### Tests for User Story 4 (REQUIRED)

- [X] T059 [P] [US4] Add contract tests for `GET /api/v1/measurements/<id>` pending, recognized, failed, and ownership cases in tests/contract/mobile-api.contract.test.ts
- [X] T060 [P] [US4] Add contract tests for `POST /api/v1/measurements/<id>/save` success, not-owned, and invalid-state cases in tests/contract/mobile-api.contract.test.ts
- [X] T061 [P] [US4] Add unit tests for measurement state policy recognition and save transitions in tests/unit/domain/measurement-state-policy.test.ts
- [X] T062 [P] [US4] Add unit tests for detail, save, and recognition task processing use cases in tests/unit/application/measurement-review.use-cases.test.ts
- [X] T063 [P] [US4] Add integration test for review, recognition result persistence, and save confirmation in tests/integration/mobile-api.integration.test.ts

### Implementation for User Story 4

- [X] T064 [US4] Implement get measurement detail use case in src/application/use-cases/get-measurement-detail.use-case.ts
- [X] T065 [US4] Implement save measurement use case in src/application/use-cases/save-measurement.use-case.ts
- [X] T066 [US4] Implement recognition task processing use case that persists systolic, diastolic, pulse, and arm side in src/application/use-cases/process-recognition-task.use-case.ts
- [X] T067 [US4] Add detail response DTO mapping for pending, recognized, saved, and failed states in src/adapters/inbound/http/dto/measurement.dto.ts
- [X] T068 [US4] Add authenticated `GET /api/v1/measurements/<id>` route to measurements controller in src/adapters/inbound/http/measurements.controller.ts
- [X] T069 [US4] Add authenticated `POST /api/v1/measurements/<id>/save` route to measurements controller in src/adapters/inbound/http/measurements.controller.ts
- [X] T070 [US4] Wire detail, save, and recognition processing providers in src/api.module.ts

**Checkpoint**: User Story 4 can be validated independently by retrieving and saving recognized owned measurements.

---

## Phase 7: User Story 5 - Browse Measurement History (Priority: P3)

**Goal**: Logged-in users can browse saved measurements in paginated pages filtered by server-assigned measurement time, with no image binary data in list responses.

**Independent Test**: Seed saved, pending, failed, unconfirmed, and cross-user measurements; request filtered pages and verify only the authenticated user's saved matches are returned with pagination metadata.

### Tests for User Story 5 (REQUIRED)

- [X] T071 [P] [US5] Add contract tests for `GET /api/v1/measurements` pagination, time filters, empty results, and invalid ranges in tests/contract/mobile-api.contract.test.ts
- [X] T072 [P] [US5] Add unit tests for pagination and time-range policy in tests/unit/domain/pagination-policy.test.ts
- [X] T073 [P] [US5] Add unit tests for list measurements use case filtering saved-only owned measurements in tests/unit/application/list-measurements.use-case.test.ts
- [X] T074 [P] [US5] Add integration test for history list excluding images, pending, failed, unconfirmed, and cross-user measurements in tests/integration/mobile-api.integration.test.ts

### Implementation for User Story 5

- [X] T075 [US5] Implement list measurements use case in src/application/use-cases/list-measurements.use-case.ts
- [X] T076 [US5] Add history query DTO and list response DTO mapping in src/adapters/inbound/http/dto/measurement.dto.ts
- [X] T077 [US5] Add authenticated `GET /api/v1/measurements` route to measurements controller in src/adapters/inbound/http/measurements.controller.ts
- [X] T078 [US5] Wire list measurements provider in src/api.module.ts

**Checkpoint**: User Story 5 can be validated independently with filtered saved history and stable pagination.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, security checks, regression validation, and coverage hardening across all user stories.

- [X] T079 [P] Update README with mobile API setup, environment variables, and smoke flow in README.md
- [X] T080 [P] Add API environment examples without secrets in .env.example
- [X] T081 [P] Add API quickstart validation notes if implementation choices differ from planning assumptions in specs/006-mobile-bp-api/quickstart.md
- [X] T082 Add regression test ensuring existing CLI help/predict/eval bootstrap remains unchanged in tests/integration/cli.integration.test.ts
- [X] T083 Run build validation with `npm run build` and fix issues in src/api-main.ts and src/api.module.ts
- [X] T084 Run full test coverage with `npm run test:coverage` and close coverage gaps in tests/unit/application/ and tests/unit/domain/
- [X] T085 Run lint validation with `npm run lint` and fix issues in src/ and tests/
- [X] T086 Review Postgres migration indexes and constraints for ownership, token expiry, and history filter performance in src/infrastructure/database/migrations/001_mobile_api.sql
- [ ] T087 Verify quickstart smoke commands work against the local API server and update specs/006-mobile-bp-api/quickstart.md if needed

   Note: deferred until a local PostgreSQL database is available for the API server; build, lint, contract, integration, and coverage validation passed in this workspace.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
- **Polish (Phase 8)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - no dependency on other stories and is the MVP.
- **User Story 2 (P1)**: Can start after Foundational, but protected route validation becomes more useful once US1 token issuance exists.
- **User Story 3 (P1)**: Depends on bearer authentication behavior from US2 for end-to-end verification, but upload policy/use-case work can start after Foundational.
- **User Story 4 (P2)**: Depends on US3 measurement upload records and recognition tasks.
- **User Story 5 (P3)**: Depends on US4 saved measurement state for realistic history results.

### Within Each User Story

- Tests MUST be written and fail before implementation.
- Domain entities/policies before application use cases.
- Application use cases before HTTP routes.
- Routes and adapters before integration validation.
- Story complete before moving to the next priority when working sequentially.

### Parallel Opportunities

- Setup tasks T002, T003, T005, and T006 can run in parallel after T001 decisions are clear.
- Foundational entity, policy, and port tasks T007-T022 can run in parallel because they touch different files.
- Postgres repositories T026-T029 and filesystem storage T030 can run in parallel after ports and schema are defined.
- Tests within each user story are marked [P] and can be written in parallel.
- Different story implementation can proceed in parallel after Foundational if team capacity exists, respecting the practical US3 -> US4 -> US5 data-flow dependencies.

---

## Parallel Example: User Story 1

```bash
# Launch all User Story 1 tests together:
Task: "T034 [US1] Contract tests for POST /api/v1/signin in tests/contract/mobile-api.contract.test.ts"
Task: "T035 [US1] Unit tests for email normalization and duplicate account rules in tests/unit/domain/user-account.test.ts"
Task: "T036 [US1] Unit tests for create account use case in tests/unit/application/create-account.use-case.test.ts"
Task: "T037 [US1] Integration test for signin in tests/integration/mobile-api.integration.test.ts"
```

## Parallel Example: User Story 3

```bash
# Launch upload-focused tests together:
Task: "T051 [US3] Contract tests for POST /api/v1/measurements in tests/contract/mobile-api.contract.test.ts"
Task: "T052 [US3] Unit tests for upload image policy in tests/unit/domain/upload-image-policy.test.ts"
Task: "T053 [US3] Unit tests for submit measurement use case in tests/unit/application/submit-measurement-image.use-case.test.ts"
Task: "T054 [US3] Integration test for authenticated upload in tests/integration/mobile-api.integration.test.ts"
```

## Parallel Example: User Story 4

```bash
# Launch review/save tests together:
Task: "T059 [US4] Detail contract tests in tests/contract/mobile-api.contract.test.ts"
Task: "T060 [US4] Save contract tests in tests/contract/mobile-api.contract.test.ts"
Task: "T061 [US4] State policy tests in tests/unit/domain/measurement-state-policy.test.ts"
Task: "T062 [US4] Review use-case tests in tests/unit/application/measurement-review.use-cases.test.ts"
Task: "T063 [US4] Review/save integration test in tests/integration/mobile-api.integration.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. STOP and validate signin contract, unit, and integration tests independently.
5. Demo account creation returning an expiring bearer token.

### Incremental Delivery

1. Complete Setup + Foundational -> foundation ready.
2. Add User Story 1 -> account creation MVP -> test independently.
3. Add User Story 2 -> login and bearer auth -> test independently.
4. Add User Story 3 -> authenticated upload and pending recognition scheduling -> test independently.
5. Add User Story 4 -> detail/review/save -> test independently.
6. Add User Story 5 -> saved history list -> test independently.
7. Complete Polish -> documentation, regression, coverage, lint, and quickstart validation.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together.
2. Once Foundational is done, split by story and dependency chain:
   - Developer A: User Story 1 and User Story 2 auth flows.
   - Developer B: User Story 3 upload/storage/task scheduling.
   - Developer C: User Story 4 review/save and User Story 5 history.
3. Integrate through shared contract and integration tests after each story checkpoint.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks.
- [Story] label maps task to a specific user story for traceability.
- Every story includes required tests; write tests first and confirm they fail before implementation.
- Do not modify pre-existing tests unless the spec or plan documents a required reason.
- Keep CI coverage at or above 95%, targeting 100% for changed feature areas where feasible.
- Keep feature work in the dedicated worktree under `tmp/006-mobile-bp-api`.
- Keep implementation MCP-free.
