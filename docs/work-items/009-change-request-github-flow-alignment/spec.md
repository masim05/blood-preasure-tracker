# GitHub Flow Alignment Change Request Spec

## Task

Address pull request review comments that identify inconsistent GitLab/GitHub platform guidance in the AI development flow and repository policy checks.

## Current Problem

The repository is currently reviewed and hosted through GitHub, but parts of the live AI flow configuration, platform entrypoints, role prompts, project-structure documentation, Definition of Done, and PR policy check still point agents toward GitLab or GitLab CI.

## Requested Change

- Configure `.ai-flow.yml` to use `git.cli: gh`.
- Align live platform-facing instructions with GitHub issues, pull requests, and GitHub Actions.
- Keep the existing `gitlab.language` configuration key as the compatibility key for communication language while making surrounding wording platform-neutral.
- Validate GitHub pull request and issue templates in `scripts/check-pr.sh`.
- Add the GitHub pull request and issue templates required by that policy check.

## Out of Scope

- Rewriting historical work-item artifacts that record previous GitLab-oriented decisions.
- Removing existing `.gitlab/` templates.
- Changing product code or runtime server behavior.

## Acceptance Criteria

- `scripts/check-ai-flow-config.sh` reports `Git CLI: gh` for the checked-in configuration.
- Live guidance no longer tells agents that GitLab is the source of truth for this repository.
- PR policy validation checks GitHub-native template paths and passes.
- Architecture/project-structure docs identify GitHub-native CI and pull request templates as required structure.