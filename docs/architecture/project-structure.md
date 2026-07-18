# Project Structure

This document defines the required repository structure.

## Root files

- `README.md` — human-facing project overview.
- `AGENTS.md` — common contract for all AI agents.
- `CLAUDE.md` — Claude-specific entrypoint that links to `AGENTS.md`.
- `CODEX.md` — Codex-specific entrypoint that links to `AGENTS.md`.
- `.ai-flow.yml` — optional repository-specific AI flow configuration; omitted settings use documented defaults.
- `.github/copilot-instructions.md` — GitHub Copilot-specific entrypoint that links to `AGENTS.md`.
- `.github/workflows/ci.yml` — GitHub Actions CI pipeline for repository policy checks.

## Required directories

```txt
repo/
  README.md
  AGENTS.md
  CLAUDE.md
  CODEX.md
  .ai-flow.yml

  .github/
    copilot-instructions.md
    pull_request_template.md
    ISSUE_TEMPLATE/
      feature.md
      change-request.md
      bug.md
      chore.md
      docs.md
    workflows/
      ci.yml
    prompts/
      ai-development-flow.prompt.md

  .claude/
    skills/
      ai-development-flow/
        SKILL.md

  .agents/
    skills/
      ai-development-flow/
        SKILL.md
        agents/
          openai.yaml

  docs/
    ai/
      README.md
      prompts/
      skills/
      agents/

    architecture/
      overview.md
      principles.md
      boundaries.md
      project-structure.md
      decisions/

    engineering/
      ai-development-flow.md
      change-policy.md
      definition-of-done/
        README.md
        feature.md
        change-request.md
        bugfix.md
        chore.md
        docs.md
      testing-policy.md

    work-items/
      README.md
      NNN-<type>-<short-slug>/

  src/
    ...

  tests/
    integration/
      cli.integration.test.ts
      mobile-api.integration.test.ts
    e2e/

  tmp/
    wts/
      <task-slug>/

  scripts/
    check-ai-flow-config.sh
```

## Web server

The web server lives in the root TypeScript project under `src/` and is started from the compiled `dist/api-main.js` entrypoint by `npm run api`.

Server-specific source layout:

```txt
src/
  api-main.ts                         # NestJS API bootstrap and listen loop
  api.module.ts                       # Web server composition root

  adapters/
    inbound/
      http/
        auth.controller.ts            # /api/v1/signin and /api/v1/login
        auth-rate-limit.guard.ts      # per-client/email signin/login rate limit
        bearer-auth.guard.ts          # Authorization: Bearer token guard
        http-error.mapper.ts          # ApiError -> HTTP JSON error response
        http-request-logging.ts       # request/status metadata logging
        measurements.controller.ts    # authenticated measurement API routes
        dto/                          # HTTP request parsing and response DTO helpers
        web/                          # server-rendered / and /policy pages
      worker/
        recognition-task.worker.ts    # scheduled persisted recognition task runner

    outbound/
      crypto/                         # password hashing and opaque bearer tokens
      filesystem/                     # image files, metadata, CSV/image helpers
      llm/                            # model registry and OpenAI vision adapter
      postgres/                       # pg pool and server repositories

  application/
    ports/                            # use-case contracts for side effects
    use-cases/                        # account, auth, measurement, recognition flows

  domain/
    entities/                         # server and CLI domain records
    services/                         # pure validation/state/pagination policies

  infrastructure/
    config/                           # API, CLI, env, and logging configuration
    database/
      migrations/001_mobile_api.sql   # server schema for spec 006
```

Related server artifacts:

- `specs/006-mobile-bp-api/` stores the source specification, plan, data model, quickstart, API/logging contracts, and task traceability for the web server.
- `docs/openapi.yaml` is the generated/public HTTP API contract for mobile and other API clients.
- `tests/contract/mobile-api.contract.test.ts` and `tests/contract/mobile-api-logging.contract.test.ts` cover HTTP contract behavior.
- `tests/integration/mobile-api.integration.test.ts` covers API behavior across repositories, auth, uploads, recognition, history, and logging.
- `src/infrastructure/database/migrations/001_mobile_api.sql` is applied by the DB migration tooling and must stay aligned with Postgres repositories and the API data model.

## Work Items Structure

Work items are organized as a single chronological work stream.

Pattern:

```txt
docs/work-items/NNN-<type>-<short-slug>/
```

Allowed task types:

- `feat`
- `change-request`
- `bug`
- `chore`
- `docs`

Examples:

- `docs/work-items/001-feat-login/`
- `docs/work-items/002-change-request-checkout-copy/`
- `docs/work-items/003-bug-user-cant-login/`
- `docs/work-items/004-chore-docker-tools/`
- `docs/work-items/005-docs-api-readme/`

## Work Item Requirements

A work item directory is required for:

- every feature;
- every change request;
- every non-trivial bugfix;
- every risky chore;
- every docs change that changes project policy, architecture documentation, onboarding, or agent instructions.

A work item directory is optional for:

- typo fixes;
- small obvious bugfixes;
- mechanical cleanup;
- simple dependency bumps;
- small docs edits.

## Worktree Policy

`ai-development-flow` work must happen in dedicated git worktrees under:

```txt
tmp/wts/<task-slug>/
```

Rules:

- `ai-development-flow` creates or reuses the task worktree before writing work-item artifacts or implementation changes.
- The primary checkout of the repository must not be used for artifacts or implementation produced by an `ai-development-flow` run.
- Outside `ai-development-flow`, use dedicated worktrees when the task or requester explicitly requires isolated execution.
- Parallel work by humans and multiple AI assistants must use separate worktrees.
- Worktree paths under `tmp/wts/` are local working areas and must not become the source of truth for durable project documentation.
