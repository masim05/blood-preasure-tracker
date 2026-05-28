# Quickstart: Integration Test Assertions

## 1. Use the current checkout

Maintainer explicitly waived dedicated worktree isolation for this maintenance change. Work in the current checkout on branch `008-integration-test-assertions`:

```bash
git status --short --branch
```

## 2. Review the target suite

```bash
rg "describe\\(|it\\(" tests/integration/mobile-api.integration.test.ts
```

Only edit `tests/integration/mobile-api.integration.test.ts`, and only inside `mobile API integration flow`. Do not add new test files.

## 3. Restructure assertions

For each existing endpoint-level `describe` block:

1. Keep the `describe` title unchanged.
2. Add scenario-local setup helpers when repeated requests or identifiers are needed.
3. Add `it('responds with HTTP <code>', ...)` for the status assertion.
4. Add `it('responds with proper json', ...)` for JSON response body assertions.
5. Use a binary/image-specific format example for image byte responses.
6. Split existing PostgreSQL, filesystem, OpenAI-boundary, or logging checks into separate named examples.
7. Keep each focused example independent after the outer reset hooks run; do not rely on state created by a sibling `it`.
8. Do not change expected response bodies, status codes, persistence behavior, setup, cleanup, or mocks.

## 4. Validate locally

Initialize the test database and run the targeted integration suite:

```bash
npm run db:init -- --env .env.test
npm run test:integration -- --runTestsByPath tests/integration/mobile-api.integration.test.ts --verbose
```

Run lint before finishing:

```bash
npm run lint
```

## 5. Review scope

```bash
git diff --stat
git diff -- tests/integration/mobile-api.integration.test.ts
```

The final implementation diff must not include product source files, new test files, or other existing test files.
