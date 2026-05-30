# Quickstart: CI Seed Hooks

## Goal

Validate locally that Android Maestro fixtures are prepared through the Jest bootstrap path instead of inline CI YAML seeding.

## Prerequisites

- Node.js 24.x
- Repository dependencies installed with `npm ci`
- PostgreSQL available for `.env.test`

## Local Validation Steps

1. Initialize the test database:

   ```sh
   npm run db:init -- --env .env.test
   ```

2. Run the Android bootstrap Jest target that seeds Maestro fixtures:

   ```sh
   npx jest --runInBand --runTestsByPath tests/bootstrap/android-ci-bootstrap.test.ts
   ```

3. Run the same bootstrap command a second time to confirm idempotency:

   ```sh
   npx jest --runInBand --runTestsByPath tests/bootstrap/android-ci-bootstrap.test.ts
   ```

4. Validate workflow contract coverage:

   ```sh
   npx jest --runInBand --runTestsByPath src/test-workflow.contract.test.ts
   ```

5. Run the repository coverage gate:

   ```sh
   npm run test:coverage
   ```

## Expected Results

- The bootstrap Jest target exits successfully on both runs.
- The workflow contract test confirms DB init precedes bootstrap and bootstrap precedes Android build/Maestro steps.
- No workflow assertions depend on inline seed heredocs in `.github/workflows/ci.yml`.

## Verification Notes (2026-05-30)

- `npx jest --runInBand --runTestsByPath tests/bootstrap/android-ci-bootstrap.test.ts` passed (`2` tests).
- `npx jest --runInBand --runTestsByPath tests/bootstrap/android-ci-bootstrap.test.ts src/test-workflow.contract.test.ts` passed (`11` tests).
- `npm run test:coverage` passed with global coverage above the 95% gate.
- Scope guard check (`git status --short`) showed only CI/test setup paths plus feature docs and `jest.config.ts` changed.
- Baseline verification confirmed `package.json` keeps `node` engine `>=24.0.0` and NestJS `^11.1.23` dependencies.
- Dependency diff check (`git diff -- package.json`) showed no new third-party dependencies.
