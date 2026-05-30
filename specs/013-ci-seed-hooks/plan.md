# Implementation Plan: CI Seed Hooks

**Branch**: `017-move-seed-before-hooks` | **Date**: 2026-05-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/013-ci-seed-hooks/spec.md`

**Note**: This plan is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Replace the inline Android Maestro seed heredoc in `.github/workflows/ci.yml` with an Android-only Jest bootstrap step that runs after `npm run db:init -- --env .env.test` and before Gradle/Maestro execution. Extract the seed logic into shared test bootstrap support that uses the existing `pg` dependency and deterministic fixture data, then extend workflow contract validation so CI fails if inline seeding returns or if bootstrap ordering changes.

## Technical Context

**Language/Version**: TypeScript 5.8.x on Node.js 24.x

**Android Language/Version**: N/A

**Primary Dependencies**: Jest 30, ts-jest, existing `pg` driver, `node:crypto`, `node:fs`, GitHub Actions hosted runner actions already in the workflow

**Storage**: PostgreSQL test database from `.env.test`; workflow YAML and Jest bootstrap files in-repo

**Testing**: Existing `src/test-workflow.contract.test.ts`; new Android bootstrap-focused Jest target/test; existing `npm run test:coverage`; existing Android Gradle and Maestro steps remain downstream consumers of seeded data

**Target Platform**: GitHub Actions `ubuntu-latest` runner and local macOS/zsh reproduction against `.env.test`

**Project Type**: Node/NestJS repository with GitHub Actions CI and Android validation job

**Android Source Root**: N/A

**Performance Goals**: Android bootstrap seed step completes in under 5 seconds on the local/Postgres CI fixture database and adds no more than roughly 10 seconds to the Android CI job before Gradle execution

**Constraints**: Changes stay within `.github/workflows/ci.yml` and test bootstrap support; no API runtime code changes; no API behavior test changes; non-Android CI jobs must not seed Android fixtures; seed path must be idempotent; DB init remains the prerequisite step

**API Error UX**: N/A

**Localization**: N/A

**Scale/Scope**: 1 Android CI job, 1 dedicated Jest bootstrap invocation, 2 seeded users, 1 seeded saved measurement, and 2 regression surfaces (workflow contract plus bootstrap behavior)

**Maestro Coverage**: Existing Android Maestro happy-path flows remain unchanged and consume the seeded fixtures prepared before emulator execution

**Mobile Unit Coverage**: N/A

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [X] **Hexagonal boundaries defined**: No domain or adapter runtime boundaries change; new logic remains isolated in test bootstrap support and CI orchestration.
- [X] **Unit test strategy present**: Plan adds bootstrap-focused Jest validation and extends CI workflow contract assertions.
- [X] **Coverage policy acknowledged**: Repository CI gate remains `>= 95%`; changed contract/bootstrap surfaces are covered directly and aim for 100% where practical.
- [X] **Additive test evolution respected**: Existing API behavior tests remain unchanged; only workflow contract and new bootstrap validation are added/updated.
- [X] **MCP-free implementation**: Plan uses repository scripts, Jest, GitHub Actions, and existing Node dependencies only.
- [X] **Feature isolation via worktree**: Work occurs in `tmp/017-move-seed-before-hooks` on branch `017-move-seed-before-hooks`.
- [X] **Tech stack baseline**: Plan keeps Node.js 24.x and NestJS 11.x repository baselines.
- [X] **Android source location**: N/A for this feature; no Android source changes are planned.
- [X] **Kotlin LTS baseline**: N/A for this feature; no Android source changes are planned.
- [X] **API errors visible to users**: N/A for this feature; no mobile UI/API behavior changes are planned.
- [X] **Localization coverage**: N/A for this feature; no mobile UI strings are introduced.
- [X] **Maestro happy paths**: Existing Maestro flows remain unchanged; this feature preserves their prerequisite data.
- [X] **Android unit coverage**: Existing Android coverage gate remains unchanged because the feature alters only CI/bootstrap support.
- [X] **Dependency policy**: Uses existing built-in modules plus existing `pg`; no new third-party dependency is required.

Post-Phase-1 re-check: still passes. The design keeps changes confined to CI orchestration and test bootstrap support, adds direct regression coverage, and avoids runtime/mobile source modifications.

## Project Structure

### Documentation (this feature)

```text
specs/013-ci-seed-hooks/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/
│   ├── android-jest-bootstrap.md
│   └── ci-workflow-order.md
└── tasks.md             # Phase 2 output (/speckit.tasks command output)
```

### Source Code (repository root)

```text
.github/
└── workflows/
    └── ci.yml

src/
├── test-support/
│   └── android-maestro-fixtures.ts
└── test-workflow.contract.test.ts

tests/
├── bootstrap/
│   └── android-ci-bootstrap.test.ts
└── integration/
    └── mobile-api.integration.test.ts

jest.config.ts
```

**Structure Decision**: Keep the repository as a single Node/NestJS project and add a dedicated Android-only Jest bootstrap surface under `tests/bootstrap/`, backed by shared fixture logic in `src/test-support/`. This keeps seed behavior in the requested Jest `before` lifecycle, preserves non-Android jobs, and limits file changes to CI plus test bootstrap support.

## Complexity Tracking

> No constitution violations. No complexity exceptions required.
