# Implementation Plan: Background Recognition Worker

**Branch**: `[016-add-background-worker]` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-background-recognition-worker/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement an automatic background worker that drains queued recognition tasks and processes them using the existing recognition use case path, with FIFO claim ordering, environment-configurable poll interval and batch size, and bounded retry semantics (one retry on next poll cycle, then terminal failure).

## Feature Artifacts

- Research: `specs/013-background-recognition-worker/research.md`
- Data model: `specs/013-background-recognition-worker/data-model.md`
- Contract: `specs/013-background-recognition-worker/contracts/recognition-worker.md`
- Validation runbook: `specs/013-background-recognition-worker/quickstart.md`

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.8.x on Node.js latest active LTS baseline (repository engines currently `>=24.0.0`)

**Android Language/Version**: N/A

**Primary Dependencies**: NestJS 11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`), PostgreSQL (`pg`), OpenAI SDK (`openai`), optional official NestJS scheduling support for worker polling

**Storage**: PostgreSQL tables (`recognition_tasks`, `measurements`) plus filesystem-backed measurement image storage

**Testing**: Jest (`npm run test`, `npm run test:coverage`) with unit/integration-style use-case and repository tests

**Target Platform**: NestJS API service runtime on macOS/Linux development and CI environments

**Project Type**: Backend web-service/API with asynchronous background task processing

**Android Source Root**: N/A

**Performance Goals**: Meet spec success criteria: >=95% valid queued tasks completed within 5 minutes under normal load; no queued task remains stuck beyond 15 minutes after worker recovery

**Constraints**: Poll interval from env (default 10s), batch size from env (default 4), FIFO claim order, one retry on next cycle only, no API contract changes unless defect correction is documented

**API Error UX**: N/A

**Localization**: N/A

**Scale/Scope**: Single backend feature affecting recognition queue orchestration and associated tests in `src/`; no Android scope

**Maestro Coverage**: N/A

**Mobile Unit Coverage**: N/A

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [X] **Hexagonal boundaries defined**: Domain logic depends only on ports; planned
  adapters are listed and isolated from domain code.
- [X] **Unit test strategy present**: New/changed behavior has corresponding unit
  tests planned.
- [X] **Coverage policy acknowledged**: CI gate is `>= 95%`, with a plan to reach
  `100%` for changed feature areas when feasible.
- [X] **Additive test evolution respected**: Existing tests remain unchanged unless
  a requirement/defect rationale is documented.
- [X] **MCP-free implementation**: Plan uses local repository tooling only; no MCP
  dependency in development steps.
- [X] **Feature isolation via worktree**: Feature branch/worktree strategy uses
  dedicated worktrees under `tmp/` and meaningful branch naming.
- [X] **Tech stack baseline**: Plan targets latest active Node.js LTS and latest
  active NestJS LTS.
- [X] **Android source location**: Mobile app code is planned under `mobile/android`
  when Android is affected.
- [X] **Kotlin LTS baseline**: Android work targets the latest active LTS Kotlin
  release when Android is affected.
- [X] **API errors visible to users**: Android/mobile API error responses have
  explicit user-visible UI handling.
- [X] **Localization coverage**: Every visible Android/mobile string is routed
  through localized resources or an equivalent localization mechanism.
- [X] **Maestro happy paths**: Every Android mobile user story has a happy-path
  Maestro flow planned.
- [X] **Android unit coverage**: Android unit tests maintain a `>= 95%` CI gate.
- [X] **Dependency policy**: Official Node.js/NestJS modules are preferred; any
  third-party alternative is justified.

## Project Structure

### Documentation (this feature)

```text
specs/013-background-recognition-worker/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/
│   └── recognition-worker.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── application/
│   ├── ports/
│   └── use-cases/
├── domain/
│   ├── entities/
│   └── services/
├── adapters/
│   ├── inbound/http/
│   └── outbound/
│       ├── postgres/
│       ├── filesystem/
│       └── llm/
├── infrastructure/
│   ├── config/
│   └── database/migrations/
└── api.module.ts
```

**Structure Decision**: Single backend project structure. The worker orchestration is added within existing backend modules under `src/` and tested with existing Jest-based test layout.

## Post-Design Constitution Check

- [X] Planned design keeps domain rules in existing use cases/services and adds worker orchestration via ports/adapters.
- [X] Additive tests are planned for queue claim, retry timing, and terminal-state idempotency without unrelated rewrites.
- [X] Coverage plan remains aligned with `>= 95%` CI gate, with feature-area tests targeted for full path coverage.
- [X] Work remains in dedicated feature worktree `tmp/015-background-worker` on branch `016-add-background-worker`.
- [X] Dependency policy remains compliant: prefer official NestJS capability first and justify any third-party additions.
- [X] No constitution violations detected.

## Complexity Tracking

No constitution violations or complexity exceptions require justification.
