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
      .gitkeep

  src/
    ...

  tests/
    integration/
      check-ai-flow-config.sh
      cli.integration.test.ts
      mobile-api.integration.test.ts
    e2e/

  tmp/
    wts/
      <task-slug>/

  scripts/
    check-ai-flow-config.sh
```

## Android app structure

Android app code lives in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/` and follows layer intent aligned with `docs/architecture/boundaries.md`.

```txt
mobile/android/
  app/
    build.gradle.kts                    # Android app config, BuildConfig API_BASE_URL wiring, coverage gate
    src/main/
      AndroidManifest.xml               # app permissions and app entry activity
      kotlin/com/masim05/bloodpressure/mobile/
        MainActivity.kt                 # composition root and route/navigation coordinator
        LanguageSupport.kt              # supported language model + constants
        adapters/
          api/
            HttpApiClient.kt            # HTTP implementation of auth/history/upload/detail gateways
            ApiErrorMapper.kt           # transport error normalization
          camera/
            CameraXCameraGateway.kt     # camera capture handoff to flow layer
            GeneratedCameraGateway.kt   # generated/test-friendly camera gateway variant
          session/
            EncryptedSessionStore.kt    # SessionStore via Android Keystore + SharedPreferences
            InMemorySessionStore.kt     # non-persistent SessionStore for tests/tools
        core/
          flow/
            AppFlows.kt                 # AuthFlow/GuideFlow/CaptureFlow/HistoryFlow/MeasurementDetailFlow
          model/
            DomainModels.kt             # Session, Measurement, detail/filter enums and state records
          ports/
            Ports.kt                    # flow-facing interfaces for adapters
          validation/
            Validators.kt               # pure input/filter/image validation
        ui/
          screens/                      # Auth/Guide/Camera/History/Detail/Profile composables
          theme/                        # Compose theme
          TestTags.kt                   # UI automation test tags
      res/                              # localized strings, guide assets, launcher resources
```

### Android structure rules

- `MainActivity.kt` remains the only app-level composition root for flow/adapters wiring.
- `core/flow`, `core/model`, and `core/validation` remain Android-framework agnostic.
- `adapters/*` own integration details (HTTP/camera/storage) and must implement `core/ports/*` contracts.
- `ui/screens/*` must stay render/event oriented and must not own persistence/network decisions.
- `build.gradle.kts` remains the source of truth for API host injection and coverage gate policy.

## Web server structure

The web server lives in the root TypeScript project under `src/` and is started from compiled `dist/api-main.js` by `npm run api`.

```txt
src/
  api-main.ts                         # NestJS API bootstrap and listen loop
  api.module.ts                       # Web server composition root

  adapters/
    inbound/
      http/
        auth.controller.ts            # /api/v1/signin and /api/v1/login
        auth-rate-limit.guard.ts      # per-client/email signin/login rate limit
        bearer-auth.guard.ts          # Authorization: Bearer guard
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

## Work items structure

`docs/work-items/` is retained in the repository with `docs/work-items/.gitkeep` only.

AI-flow work-item artifacts are temporary handoff artifacts used during a task. They are not required durable repository structure and should be removed before merge unless the task explicitly asks to retain them.

## Worktree policy

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
