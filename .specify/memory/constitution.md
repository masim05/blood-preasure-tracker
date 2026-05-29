<!--
Sync Impact Report
- Version change: 1.2.0 -> 1.3.0
- Modified principles:
  - VI. Android Mobile Client Standards -> VI. Android Mobile Client Standards
  - Engineering Constraints -> Engineering Constraints
- Added sections:
  - None
- Removed sections:
  - None
- Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ updated
  - .specify/templates/spec-template.md: ✅ updated
  - .specify/templates/tasks-template.md: ✅ updated
  - .specify/templates/commands/*.md: ⚠ pending (directory not present in this repository)
  - .specify/extensions/git/commands/*.md: ✅ checked, no updates required
  - .specify/extensions/git/README.md: ✅ checked, no updates required
  - README.md: ✅ updated
  - specs/009-android-mobile-app/spec.md: ✅ updated
  - specs/009-android-mobile-app/plan.md: ✅ updated
- Deferred TODOs:
  - None
-->

# Blood Pressure Tracker Constitution

## Core Principles

### I. Ports & Adapters First (Hexagonal)

All new features MUST be implemented using a ports-and-adapters (hexagonal)
architecture. Domain logic MUST depend only on port interfaces and MUST NOT depend
directly on frameworks, transport layers, persistence drivers, or external APIs.
Adapters MAY depend on domain ports, never the reverse.

Rationale: This preserves testability, supports adapter replacement, and prevents
infrastructure concerns from leaking into business rules.

### II. Coverage-Gated Unit Testing

Unit tests are mandatory for every feature and bug fix. CI MUST enforce a minimum
overall line coverage gate of 95%. Android mobile code MUST also enforce a
minimum unit-test coverage gate of 95%. Teams SHOULD drive changed modules and
features to 100% coverage when practical and justified by risk.

Rationale: High automated test confidence is required to ship safely and keep
regressions detectable early.

### III. Additive Test Evolution

When adding a new feature, existing tests MUST NOT be rewritten for convenience.
Existing tests MAY only change to correct defects, real requirement changes, or
remove proven dead behavior. Every new feature MUST include new tests that validate
its behavior and preserve or improve coverage.

Rationale: This protects historical behavior while ensuring features are introduced
with explicit executable specifications.

### IV. MCP-Free Development

Development and implementation workflows MUST NOT rely on MCP-based tools,
orchestrators, or runtime dependencies. Local tooling, repository scripts, and
standard language/build/test toolchains are the only approved implementation path.

Rationale: Keeping development MCP-free improves reproducibility, onboarding, and
execution parity across environments.

### V. Worktree-Isolated Feature Delivery

Each feature MUST be developed in its own Git worktree, and all feature worktrees
MUST be created under `tmp/`. Branch names and commit messages MUST be meaningful,
human-readable, and directly traceable to feature intent.

Rationale: Isolated worktrees reduce cross-feature contamination while clear Git
history improves review quality and long-term maintainability.

### VI. Android Mobile Client Standards

Android mobile app source code MUST live under `mobile/android`. The Android app
MUST target the latest active LTS Kotlin release. Every user story implemented in
the Android app MUST include a passing happy-path Maestro flow. Any API error
returned to the Android app MUST be shown to the user in the app UI; errors MUST
NOT be silently swallowed or hidden only in logs. Every visible Android UI string
or text value MUST be localized through Android resources or an equivalent
localization mechanism; hardcoded visible strings in code, layouts, tests, or
Maestro flows are prohibited.

Rationale: The mobile app is the primary user-facing workflow for blood-pressure
tracking, so its source location, language baseline, user-visible failure handling,
localization readiness, and end-to-end happy paths must be predictable and
reviewable.

## Engineering Constraints

- Architecture docs and plans MUST identify the domain ports and concrete adapters
  introduced or changed by the feature.
- Runtime and toolchain MUST use the latest active LTS release of Node.js.
- Backend framework baseline MUST be the latest active LTS major of NestJS.
- Android mobile source MUST be rooted at `mobile/android`.
- Android mobile implementation MUST target the latest active LTS Kotlin release.
- Android mobile API clients MUST map every API error response to user-visible UI
  feedback.
- Every Android mobile user story MUST have at least one happy-path Maestro flow.
- Android mobile unit tests MUST meet the 95% coverage CI gate.
- Every visible Android UI string or text value MUST be localized; hardcoded
  visible text in Android code, layouts, tests, or Maestro flows is prohibited.
- New dependencies SHOULD use official Node.js or NestJS packages first (for
  example: `node:` built-ins, official `@nestjs/*` packages). Third-party modules
  require a brief justification in the plan when an official option exists.
- CI pipelines MUST fail when coverage is below 95%.
- Feature-level coverage targets SHOULD be 100% unless an explicit exception is
  documented in the implementation plan.
- Test updates for pre-existing behavior require a written reason in the
  specification or plan.
- Direct development on the main repository checkout is prohibited for feature work;
  worktree paths MUST be under `tmp/`.

## Development Workflow & Quality Gates

1. Create or switch to a dedicated worktree in `tmp/` before feature coding begins.
2. Define or update domain ports first, then implement adapters and wiring.
3. Add new tests for each new capability before marking implementation complete.
4. Run local test suites and coverage checks before opening review.
5. Ensure CI confirms coverage >= 95%; pursue 100% for changed feature areas when
   feasible.
6. Use meaningful branch names and commit messages that reflect intent and scope.
7. Verify Node.js LTS and NestJS LTS targets are captured in plan/spec artifacts.
8. Verify Android plans capture `mobile/android`, Kotlin LTS, API error display,
  localization, Maestro happy paths, and 95% mobile unit coverage when mobile
  code is affected.
9. Prefer official Node/NestJS modules before introducing third-party dependencies.
10. Keep implementation MCP-free; if a process requires MCP, it is non-compliant.

## Governance

This constitution supersedes conflicting repository conventions. Amendments require:

1. A written proposal describing the change and rationale.
2. A review of impacted templates, workflows, and guidance files.
3. Approval from maintainers responsible for architecture and quality gates.

Versioning policy:

- MAJOR: Removes or redefines principles in a backward-incompatible way.
- MINOR: Adds a principle/section or materially expands required behavior.
- PATCH: Clarifications, wording improvements, and non-semantic refinements.

Compliance review expectations:

- Every plan, specification, and task list MUST include explicit constitution checks.
- Every pull request review MUST verify architecture boundaries, test additions,
  coverage policy compliance, worktree usage, MCP-free implementation, tech stack
  baseline compliance, localization compliance, and Android mobile standards when
  mobile code is affected.
- Non-compliance MUST be documented with remediation before merge.

**Version**: 1.3.0 | **Ratified**: 2026-05-24 | **Last Amended**: 2026-05-28
