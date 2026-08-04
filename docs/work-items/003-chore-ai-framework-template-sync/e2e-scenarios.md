# E2E Scenarios: AI flow startup hygiene adoption

## Scenario 1: Flow startup policy ordering
- Given `ai-development-flow` is invoked
- When workflow policy is read
- Then startup hygiene is required before worktree setup and implementation steps.

## Scenario 2: Wrapper consistency
- Given any platform wrapper/entrypoint for ai-development-flow
- When mandatory flow gates are listed
- Then `Startup Hygiene Gate (Mandatory)` is included consistently.

## Scenario 3: Repository compatibility
- Given this repository uses GitHub CLI for flow operations
- When upstream framework updates are applied
- Then GitHub-specific configuration and behavior remain unchanged.
