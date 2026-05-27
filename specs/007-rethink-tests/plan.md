# Implementation Plan: Rethink Tests
**Branch**: `007-rethink-tests` | **Date**: 2026-05-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-rethink-tests/spec.md`

## Summary
Split the test workflow so unit/contract tests run through fast and coverage-gated commands, integration tests run through a dedicated command, and CI reports build, lint, unit/contract coverage, and integration outcomes as independent jobs. Expand the integration suite so mobile API endpoint tests use a tracked `.env.test`, run against the real PostgreSQL-backed application infrastructure after `npm run db:init -- --env .env.test`, mock only OpenAI, reset relevant database state before each endpoint-level scenario, use endpoint-specific `describe` names, and cover every documented 4xx OpenAPI response for implemented mobile API endpoints.

## Technical Context

**Language/Version**: TypeScript 5.8 on Node.js >=24.0.0

**Primary Dependencies**: NestJS 11, Jest 30, ts-jest 29.4, pg 8, OpenAI SDK 6

**Storage**: PostgreSQL for mobile API integration tests; filesystem-backed measurement image storage configured through `.env.test`; no product schema changes planned

**Testing**: Jest unit/contract suites under `src/**/*.test.ts`; integration suites under `tests/integration/**/*.test.ts`; workflow contract test under `src/test-workflow.contract.test.ts`

**Target Platform**: Local macOS/Linux developer environments and GitHub Actions Ubuntu runners using Node 24

**Project Type**: Node.js CLI plus NestJS HTTP API in a single TypeScript project

**Performance Goals**: Default `npm test` remains fast by excluding integration suites; CI jobs are eligible to run in parallel for faster PR feedback

**Constraints**: Preserve global coverage gate >=95%; do not change product business logic; do not logically rewrite existing unit/contract assertions; integration tests must be independent and order-insensitive; integration tests may mock OpenAI only

**Scale/Scope**: One repository, one Jest configuration, one GitHub Actions workflow, mobile API integration suite covering implemented endpoints in `docs/openapi.yaml`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [X] **Hexagonal boundaries defined**: Domain logic is unchanged. The plan changes test command selection, CI orchestration, and integration-test composition around existing adapters: PostgreSQL repositories, filesystem image storage, node crypto adapters, and an OpenAI test double at the LLM boundary.
- [X] **Unit test strategy present**: Workflow behavior is covered by `src/test-workflow.contract.test.ts`; mobile API endpoint behavior is covered by integration tests because the changed behavior is integration wiring and endpoint contract validation.
- [X] **Coverage policy acknowledged**: CI keeps `npm run test:coverage` as the unit/contract gate and preserves the >=95% threshold.
- [X] **Additive test evolution respected**: Existing tests may be reorganized to use real infrastructure and renamed for endpoint clarity because the spec explicitly changes integration-test requirements; unit/contract assertions remain unchanged.
- [X] **MCP-free implementation**: Implementation relies on local repository scripts, Jest, Docker/PostgreSQL via `npm run db:init`, and GitHub Actions only.
- [X] **Feature isolation via worktree**: Implementation must occur in `tmp/007-rethink-tests` on branch `007-rethink-tests`.
- [X] **Tech stack baseline**: Plan targets repository Node 24 baseline and current NestJS 11 usage.
- [X] **Dependency policy**: No new runtime dependencies are expected; existing official Node APIs, NestJS testing utilities, `pg`, and Jest mocking are sufficient.

## Project Structure

### Documentation (this feature)

```text
specs/007-rethink-tests/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- ci-workflow.md
|   |-- integration-environment.md
|   `-- npm-scripts.md
`-- tasks.md
```

### Source Code (repository root)

```text
.env.test                         # tracked non-secret integration defaults
.github/workflows/ci.yml          # independent validation jobs
docs/openapi.yaml                  # source of endpoint 4xx contract coverage
jest.config.ts                    # test discovery and coverage configuration
package.json                      # npm test command surface
src/
|-- api.module.ts                  # production API wiring reused by integration tests
|-- adapters/outbound/postgres/    # real PostgreSQL repositories
|-- adapters/outbound/filesystem/  # real image storage adapter
`-- test-workflow.contract.test.ts # workflow contract tests
tests/
`-- integration/
    |-- cli.integration.test.ts
    `-- mobile-api.integration.test.ts
```

**Structure Decision**: Keep unit and contract tests colocated under `src/`; keep integration suites under `tests/integration/`; add integration helpers inside `tests/integration/` only when shared by integration suites; do not add product modules for test-only behavior.

## Complexity Tracking

No constitution violations require complexity justification.

## Phase 0: Research

Research is captured in [research.md](research.md). All clarifications are resolved:

- Unit/contract commands use Jest path exclusion for `tests/integration`.
- Integration command selects `tests/integration/**/*.test.ts` only.
- CI uses four independent jobs and no redundant `npm test` job.
- Integration environment uses tracked `.env.test` and `npm run db:init -- --env .env.test`.
- Mobile API integration tests use real infrastructure except for an OpenAI boundary mock.
- Endpoint-level scenarios reset real database state before each scenario.
- Negative-path coverage follows all documented 4xx responses for implemented mobile API endpoints.

## Phase 1: Design

Design artifacts are captured in:

- [data-model.md](data-model.md)
- [contracts/npm-scripts.md](contracts/npm-scripts.md)
- [contracts/ci-workflow.md](contracts/ci-workflow.md)
- [contracts/integration-environment.md](contracts/integration-environment.md)
- [quickstart.md](quickstart.md)

## Post-Design Constitution Check

- [X] **Hexagonal boundaries defined**: Integration tests will instantiate the real API module or equivalent production provider graph, overriding only the `LLM_PROVIDER` OpenAI boundary with a deterministic test double.
- [X] **Unit test strategy present**: Workflow contract tests cover command/CI behavior; endpoint behavior is intentionally integration-level because the requirement is real infrastructure validation.
- [X] **Coverage policy acknowledged**: `npm run test:coverage` remains the CI coverage gate and excludes integration suites.
- [X] **Additive test evolution respected**: Integration test names, setup, and negative-path additions are requirement-driven; product behavior and unit/contract assertions remain protected.
- [X] **MCP-free implementation**: No MCP runtime or implementation dependency is introduced.
- [X] **Feature isolation via worktree**: Coding must continue in `tmp/007-rethink-tests`.
- [X] **Tech stack baseline**: Node 24 and NestJS 11 remain the baseline.
- [X] **Dependency policy**: Existing dependencies are sufficient; no third-party additions planned.
