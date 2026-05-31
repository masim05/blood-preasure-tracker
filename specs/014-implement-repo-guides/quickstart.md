# Quickstart: Implement According To Repo Guides

## Goal

Develop and validate guide-compliance enforcement according to repository contributor guides with no runtime behavior changes.

## Prerequisites

- Node.js 24.x
- npm 11+
- Repository dependencies installed (`npm ci`)
- Feature work in a dedicated worktree under `tmp/`

## Workflow

1. Create/switch to the feature worktree and branch:

   ```sh
   git fetch origin
   git worktree add tmp/014-implement-repo-guides -b 014-implement-repo-guides origin/main
   cd tmp/014-implement-repo-guides
   ```

2. Confirm guide sources and current contracts:

   ```sh
   ls README.md CONTRIBUTING.md src/test-workflow.contract.test.ts
   ```

3. Implement or update guide-compliance checks and related docs only.

4. Run canonical repository validation profile:

   ```sh
   npm run build
   npm run lint
   npm run test:coverage
   ```

5. Run targeted contract checks for workflow/policy alignment:

   ```sh
   npx jest --runInBand --runTestsByPath src/test-workflow.contract.test.ts
   ```

6. Verify change scope before commit:

   ```sh
   git status --short
   ```

## Expected Results

- Guide-compliance contracts pass and reflect `README.md` + `CONTRIBUTING.md` policy text.
- Canonical validation sequence passes (`build`, `lint`, `test:coverage`).
- No API, CLI, or Android runtime behavior changes are introduced.

## Notes

- If guide policy changes, update both guide documents and their enforcement contracts in the same change.
- Keep failure messages remediation-oriented so contributors can self-correct quickly.