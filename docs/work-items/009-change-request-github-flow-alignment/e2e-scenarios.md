# GitHub Flow Alignment Change Request E2E Scenarios

## Scenario 1: AI Flow Uses GitHub CLI

Given the checked-in `.ai-flow.yml`, when an agent runs `scripts/check-ai-flow-config.sh`, then the resolved Git CLI is `gh`.

## Scenario 2: PR Policy Uses GitHub Templates

Given the checked-in `.github/` templates, when an agent runs `scripts/check-pr.sh`, then the policy check passes without requiring `.gitlab/` templates.

## Scenario 3: Agent Reads Platform Guidance

Given an agent reads the live platform entrypoints and AI role prompts, when it prepares delivery artifacts or review updates, then it is directed to use GitHub issues, pull requests, and GitHub Actions or neutral configured-platform wording.