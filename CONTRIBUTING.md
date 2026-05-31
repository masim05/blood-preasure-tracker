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
   - git worktree add ../bpt-<short-change-name> -b <type>/<short-change-name> origin/main
2. Move into the new worktree directory.
3. Implement, test, commit, and push from that worktree only.
4. Open a pull request from the worktree branch.
5. After merge, clean up:
   - git worktree remove ../bpt-<short-change-name>
   - git branch -d <type>/<short-change-name>

## Branch Naming

Use one of the following prefixes:

- feature/<short-name>
- bugfix/<short-name>
- chore/<short-name>

Examples:

- feature/mobile-login
- bugfix/timezone-parse

## Pull Request Expectations

- Keep PR scope small and focused.
- Ensure relevant tests pass before opening a PR.
- Include a short summary of what changed and why.
- Reference related issue/spec when available.
