# Contributing

Thank you for contributing.

## Branch And Worktree Policy

All feature and bugfix work must be done in a dedicated Git worktree.

- Do not implement feature or bugfix changes directly in the main checkout.
- Create one separate worktree per feature or bugfix.
- Use a dedicated branch in that worktree.
- Keep each worktree focused on a single change.

This policy keeps work isolated, reduces accidental cross-change edits, and makes review and cleanup simpler.

## Required Workflow

1. From the repository root, create a worktree for your change:
   - git fetch origin
   - git worktree add tmp/<speckit-branch-name> -b <speckit-branch-name> origin/main
2. Move into the new worktree directory.
3. Implement, test, commit, and push from that worktree only.
4. Open a pull request from the worktree branch.
5. After merge, clean up:
   - git worktree remove tmp/<speckit-branch-name>
   - git branch -d <speckit-branch-name>

## Branch Naming

Use Speckit branch naming conventions:

- 001-<feature-name>
- 1234-<feature-name>
- YYYYMMDD-HHMMSS-<feature-name>

Examples:

- 014-implement-repo-guides
- 1234-auth-improvement
- 20260531-093000-mobile-login

## Pull Request Expectations

- Keep PR scope small and focused.
- Ensure relevant tests pass before opening a PR.
- Include a short summary of what changed and why.
- Reference related issue/spec when available.

## Canonical Validation Sequence

Before opening a pull request, run this sequence in order from the repository root:

- npm run build
- npm run lint
- npm run test:coverage
