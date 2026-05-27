# Research: Rethink Tests

## Decision: Use Jest path selection to split fast and integration suites

**Rationale**: Unit and contract tests are colocated under `src/**/*.test.ts`, while integration tests live under `tests/integration/**/*.test.ts`. Path selection keeps the split explicit, preserves current test files, and avoids changing assertions or product behavior.

**Alternatives considered**:

- Separate Jest config files: rejected for this feature because the current split is simple and can be expressed with existing CLI arguments.
- Rename test files by category: rejected because tests were just colocated and the spec forbids logical test changes.
- Jest projects: rejected as more configuration than needed for two path-based groups.

## Decision: Keep `npm run test:coverage` as the CI unit/contract job

**Rationale**: The clarified requirement chooses coverage as the authoritative CI unit/contract gate. It runs the same fast suite as `npm test` while enforcing the existing `>= 95%` threshold, so a separate `npm test` CI job would be redundant.

**Alternatives considered**:

- Run both `npm test` and `npm run test:coverage` in CI: rejected because the clarification explicitly avoids the duplicate job.
- Run only `npm test` in CI: rejected because it would drop the coverage gate from CI.
- Run integration tests under coverage: rejected because the feature separates integration validation from coverage and the current threshold is calibrated for unit/contract coverage.

## Decision: Add `npm run test:integration` for integration suites only

**Rationale**: A dedicated command gives developers and CI an explicit integration gate. Restricting it to `tests/integration/**/*.test.ts` ensures no colocated unit/contract suites run in the integration command.

**Alternatives considered**:

- Use ad hoc Jest arguments in CI only: rejected because contributors need the same command locally.
- Keep integration tests in the default Jest run: rejected because the feature goal is fast default verification.

## Decision: Split CI into independent jobs

**Rationale**: Build, lint, unit/contract coverage, and integration tests are independent checks. Separate jobs improve failure attribution and allow GitHub Actions to run them in parallel.

**Alternatives considered**:

- Keep one serial job with separate steps: rejected because it does not satisfy parallel job execution.
- Use a matrix job: rejected because build, lint, coverage, and integration use different commands and clearer standalone job names improve diagnostics.
