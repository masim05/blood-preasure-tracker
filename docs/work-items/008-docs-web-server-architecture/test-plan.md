# Web Server Architecture Documentation Test Plan

## Static Validation

- Run `npm run build` to ensure no product code was changed into a broken state.
- Run `sh scripts/check-architecture.sh` to validate architecture documentation requirements.

## Review Checks

- Confirm changed files are documentation/work-item artifacts only.
- Confirm links and paths refer to existing source, spec, contract, migration, and test files.
- Confirm mobile app architecture remains out of scope.