# Test Plan: AI framework update sync

## Checks
1. Static policy check:
   - Verify `Startup Hygiene Gate (Mandatory)` exists in `docs/engineering/ai-development-flow.md`.
   - Verify `Worktree Gate` text indicates it runs after startup hygiene.
2. Wrapper alignment check:
   - Verify startup gate appears in required references in:
     - `.agents/skills/ai-development-flow/SKILL.md`
     - `.claude/skills/ai-development-flow/SKILL.md`
     - `.github/prompts/ai-development-flow.prompt.md`
     - `docs/ai/README.md`
3. Safety check:
   - Confirm `.ai-flow.yml` remains GitHub CLI (`git.cli: gh`).
   - Confirm only scoped AI framework files changed.

## Pass criteria
- All checks above pass with no out-of-scope modifications.
