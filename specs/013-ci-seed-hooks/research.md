# Research: CI Seed Hooks

## Decision: Use a dedicated Android-only Jest bootstrap test before Gradle and Maestro

**Rationale**: The clarified requirement binds seed preparation to the repository's Jest `before` lifecycle, but non-Android CI jobs must not start seeding Android fixtures. A dedicated Jest bootstrap target, invoked only by the Android CI job after `npm run db:init -- --env .env.test`, keeps seeding in Jest while isolating it to the Android path.

**Alternatives considered**: Enabling global `setupFilesAfterEnv` for all Jest runs was rejected because it would seed fixtures during unit-contract or integration jobs. A standalone Node script called directly from CI was rejected because the clarified requirement explicitly chose the Jest lifecycle rather than a CI-only script.

## Decision: Extract seed logic into shared TypeScript test-support code using existing `pg` and `node:crypto`

**Rationale**: The inline workflow heredoc already uses deterministic PBKDF2 hashing and PostgreSQL upserts. Moving that logic into shared TypeScript test-support code preserves exact behavior, keeps local and CI execution aligned, and avoids adding dependencies because `pg` already exists in the repository.

**Alternatives considered**: Leaving the seed logic inline in YAML was rejected because it violates the feature goal. Moving the logic to raw SQL files was rejected because password hashing and reusable fixture helpers are easier to express and validate in TypeScript.

## Decision: Keep fixture identities and timestamps deterministic

**Rationale**: Stable IDs (`usr_maestro_us3`, `usr_maestro_us5`, `msr_maestro_us5`) and a fixed saved-measurement payload make Maestro prerequisites easy to reason about, support idempotent upserts, and let contract/bootstrap tests assert exact seeded state without brittle dynamic lookups.

**Alternatives considered**: Generating random IDs or timestamps per run was rejected because it complicates deterministic assertions and offers no value for a repeatable CI fixture set.

## Decision: Validate workflow migration through contract tests plus bootstrap-focused tests

**Rationale**: The regression risks are structural: seed logic drifting back into YAML, or bootstrap execution moving out of order. Extending `src/test-workflow.contract.test.ts` to enforce Android-job ordering and inline-seed absence, plus adding a bootstrap-focused Jest test to prove idempotent fixture creation, covers the feature directly without altering API behavior tests.

**Alternatives considered**: Modifying existing mobile API integration tests was rejected because the spec forbids API behavior test changes for this feature. Relying on manual CI review was rejected because it would not provide an automated regression signal.

## Decision: Load `.env.test` within bootstrap support when needed, but require DB init as a hard precondition

**Rationale**: The Android CI job already initializes the database separately, and `.env.test` defines the canonical `DATABASE_URL`. The bootstrap helper should reuse that environment contract for local reproducibility while failing fast if the schema or database is not ready, which keeps errors attributable to setup instead of later Maestro failures.

**Alternatives considered**: Embedding a separate connection string in the workflow was rejected because it duplicates configuration. Making the bootstrap step initialize the database itself was rejected because DB initialization is already an explicit CI concern and must remain ordered ahead of seeding.
