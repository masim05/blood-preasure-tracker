# Contract: CI Workflow Order

## Purpose

Capture the required Android CI job ordering after inline seed logic is removed from `.github/workflows/ci.yml`.

## Android Job Sequence

1. Check out repository
2. Set up Node.js 24 and install dependencies
3. Set up JDK and Android SDK prerequisites
4. Initialize Android test database with `npm run db:init -- --env .env.test`
5. Invoke Android-only Jest bootstrap path
6. Run Android unit tests, coverage verification, and assemble debug APK
7. Install Maestro and prepare the emulator runner script
8. Start the API
9. Run Maestro happy paths on the emulator

## Assertions the Contract Must Enforce

- The Android job still depends on PostgreSQL service configuration.
- The bootstrap step is present between DB initialization and Gradle execution.
- The workflow no longer embeds inline Node/SQL/shell seed payloads for Maestro users or measurements.
- Non-Android jobs (`build`, `unit-contract-coverage`, `integration-tests`, `lint`) keep their existing responsibilities and do not gain Android fixture seeding.

## Regression Signals

- `src/test-workflow.contract.test.ts` fails if the bootstrap step is missing, misordered, or replaced by inline seed payloads.
- Bootstrap-focused Jest validation fails if the seeded fixtures are absent or non-idempotent.
