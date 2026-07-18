# GitHub Flow Alignment Change Request Test Plan

## Policy Checks

- `sh scripts/check-ai-flow-config.sh`
- `sh scripts/check-pr.sh`
- `sh scripts/check-architecture.sh`
- `sh scripts/check-dod.sh`
- `sh scripts/check-specs.sh`

## Build Check

- `npm run build`

## Review Checks

- Confirm `.ai-flow.yml` contains `git.cli: gh`.
- Confirm active platform entrypoints and role prompts do not identify GitLab as this repository's source of truth.
- Confirm `scripts/check-pr.sh` validates `.github/` template paths.