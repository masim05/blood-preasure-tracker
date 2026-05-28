# Implementation Plan: Integration Test Assertions

**Branch**: `008-integration-test-assertions` | **Date**: 2026-05-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/008-integration-test-assertions/spec.md`

**Note**: This plan is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Reorganize only the existing `mobile API integration flow` assertions in `tests/integration/mobile-api.integration.test.ts` so each endpoint-level `describe` keeps its current name but exposes focused examples for primary HTTP status, response format, and relevant persistence/filesystem/OpenAI/logging side effects. The implementation approach is test-maintenance-only: preserve current setup, cleanup, real PostgreSQL/filesystem usage, and OpenAI-only mocking while splitting combined `it` blocks into smaller assertions that use isolated scenario setup helpers. Do not add new test files.

## Technical Context

**Language/Version**: TypeScript 5.8 on Node.js 24.x or newer

**Primary Dependencies**: Jest 30 with ts-jest, NestJS 11 testing module, PostgreSQL adapter via `pg`, existing Node.js built-ins

**Storage**: Existing `.env.test` PostgreSQL database and filesystem image directory used by the mobile API integration suite; no storage schema changes

**Testing**: `npm run db:init -- --env .env.test`, `npm run test:integration -- --runTestsByPath tests/integration/mobile-api.integration.test.ts`, plus `npm run lint` for changed test code

**Target Platform**: Local and CI Node.js runtime for the repository integration test suite

**Project Type**: Node.js/NestJS backend plus CLI repository; this feature is integration-test-only

**Performance Goals**: Preserve existing mobile API integration suite behavior; avoid unnecessary duplication with compact setup helpers while prioritizing per-example isolation over shared mutable state

**Constraints**: No product business logic changes; no new test files; no changes to test files outside `tests/integration/mobile-api.integration.test.ts`; preserve existing endpoint-level `describe` block names; preserve real DB/filesystem and OpenAI-only mocking; dedicated worktree isolation is waived for this maintenance change

**Scale/Scope**: 26 existing endpoint-level scenarios inside `mobile API integration flow`; assertion-level restructuring only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [X] **Hexagonal boundaries defined**: No domain ports or adapters change; test-only work continues to exercise the existing API boundary.
- [X] **Unit test strategy present**: No product behavior changes require new unit tests or new test files; this maintenance change is validated by the existing mobile API integration suite output and behavior.
- [X] **Coverage policy acknowledged**: CI gate remains `>= 95%`; no production files are changed, so coverage is preserved.
- [X] **Additive test evolution respected**: Only the targeted mobile API integration test may change, and only to split existing assertions for a documented requirement.
- [X] **MCP-free implementation**: Plan uses repository scripts and local tooling only.
- [X] **Feature isolation via worktree**: Maintainer explicitly waived dedicated worktree isolation for this maintenance change; implementation may proceed in the current checkout on branch `008-integration-test-assertions`.
- [X] **Tech stack baseline**: Plan targets Node.js 24.x and existing NestJS 11 project baseline.
- [X] **Dependency policy**: No new dependencies are introduced.

## Project Structure

### Documentation (this feature)

```text
specs/008-integration-test-assertions/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── mobile-api-integration-output.md
└── tasks.md              # Created by /speckit.tasks, not /speckit.plan
```

### Source Code (repository root)

```text
tests/
└── integration/
    └── mobile-api.integration.test.ts   # Only implementation file allowed to change

src/                                      # No product source changes allowed
```

**Structure Decision**: Use the existing integration test file in place. Keep the current suite and endpoint-level `describe` block hierarchy, and split individual `it` examples inside those blocks. Use scenario-local helper functions where needed so each example remains independent after the outer reset hooks run. Do not create new test files.

## Complexity Tracking

No constitution violations or extra complexity exceptions are required.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Phase 0: Research

See [research.md](research.md). Decisions resolve assertion granularity, shared scenario setup, binary response naming, and validation commands.

## Phase 1: Design & Contracts

See [data-model.md](data-model.md), [contracts/mobile-api-integration-output.md](contracts/mobile-api-integration-output.md), and [quickstart.md](quickstart.md).

## Post-Design Constitution Check

- [X] **Hexagonal boundaries defined**: Design artifacts confirm no domain or adapter changes.
- [X] **Unit test strategy present**: Test-maintenance change is validated by integration suite names and behavior; no product unit tests or new test files are required.
- [X] **Coverage policy acknowledged**: No production files change; run coverage only if implementation unexpectedly touches production source, which is prohibited by this plan.
- [X] **Additive test evolution respected**: Design preserves scenarios and expected API behavior while changing assertion granularity.
- [X] **MCP-free implementation**: Quickstart uses npm and git commands only.
- [X] **Feature isolation via worktree**: Maintainer-approved waiver permits current-checkout implementation for this maintenance change.
- [X] **Tech stack baseline**: Artifacts retain Node.js 24.x and NestJS 11 baseline.
- [X] **Dependency policy**: No dependencies are added.
