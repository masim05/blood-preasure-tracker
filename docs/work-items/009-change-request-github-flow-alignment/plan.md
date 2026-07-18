# GitHub Flow Alignment Change Request Plan

1. Fetch and read PR review comments.
2. Verify each comment against current branch contents.
3. Update `.ai-flow.yml` to select `gh`.
4. Update live AI/platform docs and role prompts to use GitHub or configured Git platform wording.
5. Update `scripts/check-pr.sh` to validate GitHub pull request and issue template locations.
6. Add the required GitHub templates.
7. Run policy checks and a build before commit/push.