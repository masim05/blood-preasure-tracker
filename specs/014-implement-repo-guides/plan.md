# Implementation Plan: Implement According To Repo Guides

**Branch**: `014-implement-repo-guides` | **Date**: 2026-05-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/014-implement-repo-guides/spec.md`

**Note**: This plan is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement repository-guide compliance guardrails so contribution workflow rules in `README.md` and `CONTRIBUTING.md` are enforced consistently through executable contract checks and one canonical validation profile, including Speckit branch naming conventions (`001-feature-name`, `1234-feature-name`, or `YYYYMMDD-HHMMSS-feature-name`). The approach keeps runtime product behavior unchanged and confines work to documentation, validation contracts, and contributor tooling/tests.

## Technical Context

**Language/Version**: TypeScript 5.8.x on Node.js 24.x LTS

**Android Language/Version**: N/A

**Primary Dependencies**: Jest 30, ts-jest, existing Node built-ins (`node:fs`, `node:path`, `node:process`) and existing repository dev tooling (ESLint/TypeScript)

**Storage**: Repository text artifacts (`README.md`, `CONTRIBUTING.md`, workflow and test files)

**Testing**: Jest contract tests (`src/*.contract.test.ts` and/or focused guide-contract tests), plus existing lint/build validation

**Target Platform**: Local macOS/zsh contributor environments and GitHub Actions runners

**Project Type**: Monorepo with Node/NestJS backend + Android app; this feature is repository tooling/contract enforcement

**Android Source Root**: N/A

**Performance Goals**: Guide-compliance checks complete in <30 seconds excluding full integration/mobile test suites

**Constraints**: No API/mobile runtime behavior changes; no MCP dependency; maintain CI coverage >=95%; preserve existing command baselines from guides unless explicitly updated; enforce Speckit branch naming conventions.

**API Error UX**: N/A

**Localization**: N/A

**Scale/Scope**: Repository-wide contributor workflow policy alignment for branch/worktree rules and pre-PR validation commands

**Maestro Coverage**: N/A

**Mobile Unit Coverage**: N/A

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [X] **Hexagonal boundaries defined**: Runtime domain/application boundaries are untouched; only docs/contracts/tooling layers are planned.
- [X] **Unit test strategy present**: New/updated guide-compliance behavior will be covered with additive contract tests.
- [X] **Coverage policy acknowledged**: Existing CI gate of `>= 95%` is preserved; changed enforcement areas target 100% where practical.
- [X] **Additive test evolution respected**: Existing behavior tests remain unchanged unless alignment with guide policy requires explicit rationale.
- [X] **MCP-free implementation**: Plan relies only on repository scripts, Jest, lint/build tooling, and Git metadata.
- [X] **Feature isolation via worktree**: Feature branch is dedicated and planned worktree path is `tmp/014-implement-repo-guides`.
- [X] **Tech stack baseline**: Node.js 24.x and NestJS 11.x baselines remain unchanged.
- [X] **Android source location**: N/A for this feature (no Android app source changes).
- [X] **Kotlin LTS baseline**: N/A for this feature.
- [X] **API errors visible to users**: N/A for this feature.
- [X] **Localization coverage**: N/A for this feature.
- [X] **Maestro happy paths**: N/A for this feature.
- [X] **Android unit coverage**: N/A for this feature.
- [X] **Dependency policy**: Existing Node/NestJS ecosystem and built-ins are sufficient; no new third-party dependency required.

Post-Phase-1 re-check: still passes. The design artifacts keep scope in repository policy enforcement, retain additive tests, and avoid runtime/mobile feature regressions.

## Project Structure

### Documentation (this feature)

```text
specs/014-implement-repo-guides/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── guide-compliance-contract.md
```

### Source Code (repository root)

```text
README.md
CONTRIBUTING.md

src/
├── adapters/
├── application/
├── domain/
├── infrastructure/
├── test-support/
├── test-workflow.contract.test.ts
└── guide-docs.contract.test.ts

tests/
├── bootstrap/
├── fixtures/
└── integration/

.github/
└── workflows/
    └── ci.yml
```

**Structure Decision**: Keep the existing API-centric single-project repository structure under `src/` and implement guide-policy enforcement through contract tests and helper utilities (`src/test-workflow.contract.test.ts`, `src/guide-docs.contract.test.ts`, and `src/test-support/*`) plus documentation alignment. No runtime API architecture changes are introduced.

## Complexity Tracking

> No constitution violations. No complexity exceptions required.

## Validation Results

- 2026-05-31: `npm run build` passed.
- 2026-05-31: `npm run lint` passed.
- 2026-05-31: `npm run test:coverage` passed.
- 2026-05-31: Coverage remained above the repository CI threshold (`>= 95%`).
