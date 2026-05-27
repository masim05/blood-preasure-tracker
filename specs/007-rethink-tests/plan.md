# Implementation Plan: Rethink Tests

**Branch**: `007-rethink-tests` | **Date**: 2026-05-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-rethink-tests/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Split the repository test workflow so local fast tests and coverage run only colocated unit/contract tests, integration tests run through a dedicated command, and CI reports build, lint, unit/contract coverage, and integration as independent parallel jobs. The implementation will adjust `package.json` scripts, Jest selection in `jest.config.ts`, and `.github/workflows/ci.yml` only; no product behavior or test assertions change.

## Technical Context

**Language/Version**: TypeScript 5.8 on Node.js 24.x project baseline

**Primary Dependencies**: Jest 30, ts-jest 29.4, ESLint 9, GitHub Actions, existing npm scripts

**Storage**: N/A

**Testing**: Jest test discovery and coverage commands; CI validation through GitHub Actions workflow structure

**Target Platform**: Local Node.js development and Ubuntu GitHub Actions runners

**Project Type**: TypeScript CLI/API repository with colocated unit/contract tests and integration tests under `tests/integration`

**Performance Goals**: Fast local feedback by excluding integration suites from `npm test` and `npm run test:coverage`; CI jobs are eligible to run in parallel rather than serially in one job

**Constraints**: Preserve coverage threshold `>= 95%`; do not change product code, business logic, or test assertions; keep integration tests and integration-only dependencies available under `tests/`

**Scale/Scope**: Current repository test suite: colocated `src/**/*.test.ts` unit/contract tests plus `tests/integration/**/*.test.ts` integration suites

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Hexagonal boundaries defined**: No domain ports or adapters are introduced or changed; changes are restricted to tooling and CI configuration.
- [x] **Unit test strategy present**: Add workflow contract tests for npm script selection and CI job structure; existing product tests remain unchanged.
- [x] **Coverage policy acknowledged**: CI gate remains `>= 95%`; `npm run test:coverage` continues to enforce the gate for unit/contract tests.
- [x] **Additive test evolution respected**: Existing test assertions remain unchanged; only command selection and CI orchestration change.
- [x] **MCP-free implementation**: Plan uses local repository scripts and GitHub Actions YAML only; no MCP runtime or tooling dependency.
- [x] **Feature isolation via worktree**: Implementation must be performed in the dedicated `tmp/007-rethink-tests` worktree on branch `007-rethink-tests`.
- [x] **Tech stack baseline**: Plan targets the existing Node.js 24 project baseline and existing NestJS 11 dependency baseline.
- [x] **Dependency policy**: No new dependencies are planned.

## Project Structure

### Documentation (this feature)

```text
specs/007-rethink-tests/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ci-workflow.md
│   └── npm-scripts.md
└── tasks.md             # Created by /speckit.tasks, not /speckit.plan
```

### Source Code (repository root)

```text
.github/workflows/
└── ci.yml               # Split serial job into parallel build/lint/coverage/integration jobs

package.json             # Update npm script command surface
jest.config.ts           # Limit default/coverage discovery to unit and contract tests

src/
├── **/*.test.ts          # Unit and contract tests included by default and coverage commands
├── test-workflow.contract.test.ts # New workflow contract tests for scripts and CI
└── test-support/         # Shared test support excluded from coverage targets

tests/
├── fixtures/             # Integration fixtures and assets
└── integration/          # Integration test suites run only by npm run test:integration
```

**Structure Decision**: Keep unit and contract tests colocated under `src/`; keep integration tests and integration assets under `tests/`; make script-level test selection explicit rather than moving tests again.

## Complexity Tracking

No constitution violations or complexity exceptions are required.

## Phase 0: Research

See [research.md](research.md).

## Phase 1: Design & Contracts

See [data-model.md](data-model.md), [contracts/npm-scripts.md](contracts/npm-scripts.md), [contracts/ci-workflow.md](contracts/ci-workflow.md), and [quickstart.md](quickstart.md).

## Post-Design Constitution Check

- [x] **Hexagonal boundaries defined**: Design artifacts confirm no domain or adapter code changes.
- [x] **Unit test strategy present**: Command and CI behavior is covered by new workflow contract tests plus command validation.
- [x] **Coverage policy acknowledged**: Coverage contract preserves the current global threshold.
- [x] **Additive test evolution respected**: Contracts explicitly forbid logical assertion changes.
- [x] **MCP-free implementation**: Quickstart uses npm and GitHub Actions only.
- [x] **Feature isolation via worktree**: Mandatory `tmp/007-rethink-tests` worktree usage is recorded.
- [x] **Tech stack baseline**: Existing Node/NestJS baselines are retained.
- [x] **Dependency policy**: No new dependencies.
