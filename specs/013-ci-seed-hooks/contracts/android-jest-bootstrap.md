# Contract: Android Jest Bootstrap

## Purpose

Define the repository-internal contract for the Android-only Jest bootstrap path that seeds Maestro fixtures before the Android CI job proceeds.

## Invocation

- **Caller**: `.github/workflows/ci.yml` Android job
- **Timing**: Immediately after `npm run db:init -- --env .env.test`
- **Execution model**: One dedicated Jest invocation whose setup happens in Jest `before` hooks inside the bootstrap test path

## Inputs

- `DATABASE_URL`: PostgreSQL connection string for the initialized test database
- `.env.test`: fallback source for `DATABASE_URL` and related test environment values when not already exported
- Existing repository dependency graph from `npm ci`

## Behavior

1. Load the test environment if required.
2. Connect to the initialized PostgreSQL test database.
3. Upsert deterministic Maestro login fixtures.
4. Upsert the deterministic saved-measurement fixture used by history/detail flows.
5. Exit successfully only after all fixtures are present.

## Postconditions

- User fixture `usr_maestro_us3` with email `us3@example.com` exists.
- User fixture `usr_maestro_us5` with email `us5@example.com` exists.
- Saved measurement fixture `msr_maestro_us5` linked to `usr_maestro_us5` exists.
- Re-running the bootstrap path against the same database succeeds without duplicate-key failures.

## Failure Contract

- If the database is unreachable or uninitialized, the bootstrap invocation exits non-zero.
- If fixture upsert fails, the Android CI job stops before Gradle, API startup, or Maestro execution.
- The bootstrap path must not mutate production configuration or runtime startup code.
