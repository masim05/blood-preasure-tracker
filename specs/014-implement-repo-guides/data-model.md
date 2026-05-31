# Data Model: Implement According To Repo Guides

## GuideRule

**Purpose**: Represents one normalized policy requirement extracted from repository guides.

**Fields**:

- `id`: string, required; stable identifier (for example `guide.worktree.required`).
- `sourceFile`: enum, required; `README.md` or `CONTRIBUTING.md`.
- `sourceSection`: string, required; heading or subsection where rule is defined.
- `statement`: string, required; normalized policy text.
- `severity`: enum, required; `error` or `warning`.
- `remediation`: string, required; contributor-facing fix guidance.

**Validation**:

- `id` must be unique.
- `sourceFile` and `sourceSection` must resolve to existing guide locations.
- `statement` must be deterministic enough to map to automated checks.

## ComplianceCheck

**Purpose**: Executable assertion that verifies one or more `GuideRule` values.

**Fields**:

- `id`: string, required; stable check identifier.
- `ruleIds`: string[], required; referenced `GuideRule.id` values.
- `kind`: enum, required; `git-metadata`, `command-contract`, or `doc-sync`.
- `status`: enum, required; `pass` or `fail`.
- `evidence`: string[], required; observed facts (command output, file snippets, parsed values).
- `message`: string, required; failure or success explanation.

**Validation**:

- Every `ruleIds` entry must map to an existing `GuideRule`.
- `fail` status must include at least one remediation-oriented message.
- Checks must be deterministic in CI and local runs.

## ValidationProfile

**Purpose**: Defines the canonical contributor pre-PR command sequence aligned with guides.

**Fields**:

- `name`: string, required; profile name (for example `pre-pr-default`).
- `commands`: string[], required; ordered list of required commands.
- `required`: boolean, required; always `true` for repository baseline profile.
- `scope`: enum, required; `repository`.
- `owner`: string, required; owning policy source (guides + contracts).

**Validation**:

- `commands` order must match guide requirements.
- Every command must exist in repository scripts/tooling.
- Contract tests must fail when guide text and profile command list diverge.

## GuideSyncSnapshot

**Purpose**: Captures the current mapping between guide rules and enforcement checks for drift detection.

**Fields**:

- `generatedAt`: ISO-8601 timestamp, required.
- `ruleCount`: integer, required.
- `checkCount`: integer, required.
- `unmappedRules`: string[], required; must be empty for full compliance.
- `staleChecks`: string[], required; checks whose source rules changed.

**Validation**:

- `unmappedRules` must be empty in passing CI state.
- `staleChecks` must be empty in passing CI state.
- Snapshot generation must not mutate runtime application state.