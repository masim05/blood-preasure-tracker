# Contract: Guide Compliance Enforcement

## Purpose

Define the repository-internal contract that keeps contributor guide policy and executable enforcement synchronized.

## Source Of Truth

- `README.md`
- `CONTRIBUTING.md`

## Contracted Policy Areas

1. Dedicated worktree usage for feature and bugfix work
2. Valid Speckit branch naming conventions for contributor changes (`001-feature-name`, `1234-feature-name`, or `YYYYMMDD-HHMMSS-feature-name`)
3. Canonical pre-PR validation command profile
4. Scope discipline (guide/policy changes should not silently alter runtime behavior)

## Enforcement Expectations

- Contract tests parse or assert policy signals from guide documents and related enforcement artifacts.
- Each policy area must emit deterministic pass/fail status.
- Failure output must include remediation guidance tied to the violated policy.

## Input/Output Contract

### Inputs

- Current Git metadata (branch/worktree context)
- Current guide documents
- Current contract/enforcement test files
- Repository command definitions (`package.json` scripts)

### Outputs

- `pass`: all contracted policy areas aligned
- `fail`: one or more policy violations with actionable remediation text

## Failure Conditions

- Guide text changes without corresponding enforcement updates
- Enforcement checks detect non-compliant branch/worktree state
- Required validation profile commands are missing, renamed, or unsynchronized

## Remediation Examples

- Worktree violation: "Create a dedicated worktree under tmp/ (for example `git worktree add tmp/014-implement-repo-guides -b 014-implement-repo-guides origin/main`) and continue from that path."
- Branch naming violation: "Rename branch to Speckit format (`001-feature-name`, `1234-feature-name`, or `YYYYMMDD-HHMMSS-feature-name`)."
- Validation profile drift: "Align docs and scripts so canonical sequence remains `npm run build`, `npm run lint`, `npm run test:coverage`."

## Non-Goals

- No API endpoint contract changes
- No CLI prediction/evaluation behavior changes
- No Android runtime UI/API behavior changes