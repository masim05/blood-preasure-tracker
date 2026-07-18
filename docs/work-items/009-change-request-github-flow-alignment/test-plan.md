# GitHub Flow Alignment Change Request Test Plan

## Policy Checks

- `bash scripts/check-ai-flow-config.sh`
- `bash scripts/check-pr.sh`
- `bash scripts/check-architecture.sh`
- `bash scripts/check-dod.sh`
- `bash scripts/check-specs.sh`

## Build Check

- `npm run build`

## Review Checks

- Confirm `.ai-flow.yml` contains `git.cli: gh`.
- Confirm active platform entrypoints and role prompts do not identify GitLab as this repository's source of truth.
- Confirm `scripts/check-pr.sh` validates `.github/` template paths.