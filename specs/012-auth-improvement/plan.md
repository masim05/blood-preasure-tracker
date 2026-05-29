# Implementation Plan: Authentication Improvement

**Branch**: `[012-auth-improvement]` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-auth-improvement/spec.md`

**Note**: This plan is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Deliver two coordinated but scope-isolated auth improvements: (1) app-only encrypted session persistence across shutdown with restore-to-Camera behavior, and (2) API-only one-week access-token TTL policy for newly issued tokens while preserving prior-token expiry semantics and unchanged refresh-token behavior. Preserve architecture boundaries, existing journey semantics, and all Android quality gates.

## Technical Context

**Language/Version**: TypeScript 5.8.x on Node.js latest active LTS baseline (repository engines currently `>=24.0.0`)

**Android Language/Version**: Kotlin 2.0.21

**Primary Dependencies**: NestJS 11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`), PostgreSQL (`pg`), AndroidX Compose Material 3, AndroidX Activity Compose, JUnit 4

**Storage**: PostgreSQL for backend bearer token records; Android encrypted local storage (Keystore-backed) for persisted mobile auth session state

**Testing**: Backend Jest suites (`npm run test`, `npm run test:coverage`), Android unit tests and coverage verify (`:app:testDebugUnitTest`, `:app:androidCoverageVerify`), Maestro happy path for mobile user story (`mobile/android/maestro`)

**Target Platform**: NestJS API service on local/dev CI runtime and Android API 26-35 app runtime

**Project Type**: Mobile + API auth policy update

**Android Source Root**: `mobile/android`

**Performance Goals**: Session restore decision and route transition complete within normal app startup window (no blocking spinner beyond existing startup behavior); auth token issuance path maintains current API response-time characteristics

**Constraints**: Story-level scope split is mandatory: US1 app-only (no API code/tests), US2 API-only (no Android code/tests); no MCP dependency; preserve existing customer journey outside explicit auth persistence entry behavior

**API Error UX**: Any API auth errors encountered in mobile restore/login flows are shown as user-visible localized UI feedback

**Localization**: Any user-visible text changes in Android continue via `res/values/strings.xml` and localized companion resources (including `values-es`)

**Scale/Scope**: 2 user stories; auth lifecycle changes only; no measurement feature expansion

**Maestro Coverage**: At least one happy-path flow for US1 covering sign-in -> shutdown/reopen simulation -> restored route to Camera

**Mobile Unit Coverage**: Android `androidCoverageVerify` remains at `>= 95%` CI gate

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [X] **Hexagonal boundaries defined**: Session persistence and API TTL policy are implemented behind existing ports/adapters boundaries with no domain/framework inversion.
- [X] **Unit test strategy present**: Add targeted backend and Android unit coverage for changed auth behaviors.
- [X] **Coverage policy acknowledged**: Preserve `>= 95%` CI gate and target full coverage for changed auth flows where feasible.
- [X] **Additive test evolution respected**: Extend tests for new behavior; do not rewrite existing tests without defect/requirement rationale.
- [X] **MCP-free implementation**: Uses repository and local toolchain commands only.
- [X] **Feature isolation via worktree**: Work is isolated to `tmp/012-auth-improvement` on branch `012-auth-improvement`.
- [X] **Tech stack baseline**: Node latest active LTS baseline and NestJS 11 LTS major are retained.
- [X] **Android source location**: Android changes remain under `mobile/android`.
- [X] **Kotlin LTS baseline**: Kotlin 2.0.21 baseline is retained.
- [X] **API errors visible to users**: Mobile auth API failures remain explicit in UI states/messages.
- [X] **Localization coverage**: No new hardcoded visible strings; resources-based localization remains enforced.
- [X] **Maestro happy paths**: US1 includes a happy-path Maestro flow plan.
- [X] **Android unit coverage**: Coverage gate remains `>= 95%`.
- [X] **Dependency policy**: Reuse existing official stack and current dependencies; no unjustified third-party additions.

## Project Structure

### Documentation (this feature)

```text
specs/012-auth-improvement/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── auth-api-policy.md
│   └── mobile-session-persistence.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── adapters/inbound/http/
│   └── auth.controller.ts
├── application/use-cases/
│   ├── create-account.use-case.ts
│   └── login-user.use-case.ts
├── infrastructure/config/
│   └── api-config.ts
└── [existing backend auth token entities and repositories]

mobile/android/
├── app/
│   └── src/
│       ├── main/kotlin/com/masim05/bloodpressure/mobile/
│       │   ├── adapters/
│       │   ├── domain/
│       │   ├── ui/
│       │   └── viewmodel/
│       └── test/kotlin/com/masim05/bloodpressure/mobile/
└── maestro/
    └── us1-signin.yaml
```

**Structure Decision**: Mobile + API structure. US1 affects Android auth-session persistence and restore behavior under `mobile/android`; US2 affects backend access-token lifetime configuration and issuance behavior under `src/`.

## Post-Design Constitution Check

- [X] Design remains ports-and-adapters compliant across both app and API scopes.
- [X] Test additions are planned additively for both US1 and US2.
- [X] Scope split constraints are enforceable through tasks and file targeting.
- [X] Android quality gates (localization, Maestro, coverage) remain explicit.
- [X] No constitution violations detected.

## Complexity Tracking

No constitution violations or complexity exceptions require justification.
