# Spec: Sync AI development framework updates from template

## Goal
Adopt relevant upstream AI framework updates from `masim05/ai-project-template` while preserving repository-specific GitHub flow behavior.

## Clarified requirement
- Find common commits first, then apply new commits from template in AI framework scope.
- Result of common-commit check: no shared commit hashes were found between this repository `main` and template `main`.

## Scope
- AI flow policy and wrapper references only:
  - `docs/engineering/ai-development-flow.md`
  - `docs/ai/README.md`
  - `.agents/skills/ai-development-flow/SKILL.md`
  - `.claude/skills/ai-development-flow/SKILL.md`
  - `.github/prompts/ai-development-flow.prompt.md`

## Selected upstream update to adopt
- Add and wire the `Startup Hygiene Gate (Mandatory)` in the AI flow policy and wrapper reference lists.

## Constraints
- Preserve repository-specific GitHub platform wording and behavior.
- Do not switch `.ai-flow.yml` `git.cli` from `gh` to `glab`.
- Do not modify product/API/mobile code.

## Acceptance criteria
1. `docs/engineering/ai-development-flow.md` includes `Startup Hygiene Gate (Mandatory)` and references it in flow ordering.
2. AI flow wrappers/reference docs include the startup gate in mandatory references.
3. Existing GitHub-oriented flow semantics remain intact.
