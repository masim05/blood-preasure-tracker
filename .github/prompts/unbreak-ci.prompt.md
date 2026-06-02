---
name: Unbreak CI
description: Fix a PR branch so CI passes by reproducing failures locally, applying minimal fixes, verifying checks, pushing, and confirming remote green.
argument-hint: PR URL or number, optional CI job name, and optional constraints
agent: agent
---

Task: Unbreak CI for the target pull request and verify it is green locally and remotely.

Use the prompt argument as context (for example: PR URL/number, failing workflow name, constraints, risky areas, or files to prioritize).

Process:
1. Identify the target PR from the argument or workspace context.
2. Fetch latest remote state, check out the PR branch, and inspect failing CI jobs/logs.
3. Reproduce each failure locally with the closest equivalent commands.
4. Implement the smallest safe fix that addresses the root cause.
5. Run local validation until all required checks for the failing jobs pass.
6. Commit with a clear message and push to the PR branch.
7. Re-check remote CI status every 5 minutes for up to 15 minutes.
8. If CI fails again within that window, inspect new failures, fix, re-validate locally, push, and continue monitoring.
9. If CI is green, report success.

Execution rules:
- Prioritize correctness and minimal-risk changes over refactors.
- Do not skip local verification before pushing.
- Keep commit scope focused on CI-fix changes only.
- Do not force-push unless explicitly requested.
- If full local parity with CI is impossible, run the best local approximation and clearly state the gap.

Return:
- PR identifier and branch.
- Root cause summary.
- Files changed.
- Local commands run and results.
- Remote CI checks observed and final status.
- Any residual risks or follow-up tasks.
