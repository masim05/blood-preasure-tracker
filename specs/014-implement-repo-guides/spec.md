# Feature Specification: Implement According To Repo Guides

**Feature Branch**: `014-implement-repo-guides`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "implementation according to repo guides"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enforce Contributor Workflow Guards (Priority: P1)

As a maintainer, I want automated checks that enforce repository guide workflow rules (dedicated worktree, branch naming, required validation commands), so contributions are consistently reviewable and policy-compliant.

**Why this priority**: Contributor workflow consistency is the foundation for every feature and bugfix in this repository; without guardrails, policy drift is immediate.

**Independent Test**: Run the guide-compliance validation checks on representative branch/worktree states and verify non-compliant states fail with actionable messages while compliant states pass.

**Acceptance Scenarios**:

1. **Given** a feature branch that is not in a dedicated worktree under `tmp/`, **When** guide-compliance validation runs, **Then** it fails before merge checks complete.
2. **Given** a branch name that does not follow Speckit naming conventions (`001-feature-name`, `1234-feature-name`, or `YYYYMMDD-HHMMSS-feature-name`), **When** guide-compliance validation runs, **Then** it reports the naming violation and exits non-zero.

---

### User Story 2 - Standardize Required Validation Commands (Priority: P2)

As a contributor, I want one documented and test-verified validation sequence aligned with repository guides, so I can confidently run the right checks before opening a pull request.

**Why this priority**: Even with branch/worktree rules, inconsistent validation leads to avoidable CI failures and review churn.

**Independent Test**: Follow the quickstart sequence end-to-end in a compliant worktree and verify each command succeeds in order and reflects guide expectations.

**Acceptance Scenarios**:

1. **Given** a contributor in a compliant worktree, **When** they run the documented validation sequence, **Then** build, lint, and required tests complete successfully.
2. **Given** required commands drift from guide documentation, **When** contract validation runs, **Then** it fails and identifies mismatched command expectations.

---

### User Story 3 - Keep Guide Documentation And Enforcement In Sync (Priority: P3)

As a reviewer, I want repository guides and enforcement artifacts to stay synchronized, so policy changes remain auditable and contributors do not receive conflicting instructions.

**Why this priority**: Unsynchronized docs and checks cause false positives, false negatives, and repeated onboarding confusion.

**Independent Test**: Update a guide rule in one place and verify corresponding enforcement contracts fail until the rule is updated everywhere required.

**Acceptance Scenarios**:

1. **Given** `README.md` or `CONTRIBUTING.md` policy text changes, **When** guide-compliance contracts run without corresponding enforcement updates, **Then** they fail with a synchronization error.
2. **Given** guide text and enforcement contracts match, **When** validation runs, **Then** it passes without manual reviewer interpretation.

### Edge Cases

- What happens when a contributor uses a compliant feature branch name but works in the main checkout instead of a `tmp/` worktree? Validation must fail with explicit worktree remediation.
- How does the system handle local environments lacking optional runtime dependencies (for example Android SDK) while still requiring core Node/NestJS checks? Validation must gate only the required guide-scoped checks for this feature and report any intentionally out-of-scope checks clearly.
- What happens when CI executes from a detached HEAD context? Guide-compliance checks must still evaluate branch/worktree policy using available CI metadata and fail safe when policy cannot be determined.

## Architecture & Test Impact *(mandatory)*

- **Ports Affected**: N/A (policy/documentation and validation-contract feature)
- **Adapters Affected**: CI/workflow contract checks and repository validation scripts/tests only
- **Boundary Guarantee**: Domain and application runtime logic remain unchanged; enforcement lives in test/contract or tooling layers
- **Node.js Version Baseline**: 24.x active LTS
- **NestJS Version Baseline**: 11.x active LTS
- **Android Source Location**: N/A
- **Kotlin Version Baseline**: N/A
- **API Error UX**: N/A
- **Localization Impact**: N/A
- **Maestro Coverage**: N/A
- **Mobile Unit Coverage**: N/A
- **Dependency Selection Rationale**: Prefer built-in Node and existing repository dependencies; avoid adding third-party packages unless explicitly justified
- **Existing Test Impact**: Existing behavioral tests remain unchanged unless required to align enforcement contracts to guide text
- **New Test Coverage**: Add or extend contract tests that validate worktree policy, branch naming policy, and required command alignment
- **Coverage Plan**: Preserve CI `>= 95%` while targeting 100% for new/changed guide-compliance checks
- **Worktree Path**: `tmp/014-implement-repo-guides`

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST enforce that feature implementation work runs in dedicated worktrees and not in the main checkout.
- **FR-002**: The system MUST validate branch naming against Speckit conventions (`001-feature-name`, `1234-feature-name`, or `YYYYMMDD-HHMMSS-feature-name`) and reject non-compliant names.
- **FR-003**: The system MUST provide a single documented validation sequence aligned to repository guides for contributor pre-PR checks.
- **FR-004**: The system MUST keep guide text and enforcement checks synchronized through automated validation.
- **FR-005**: The system MUST return actionable failure messages for each guide policy violation.
- **FR-006**: Implementation MUST preserve hexagonal boundaries; no domain runtime behavior may depend on guide-enforcement tooling.
- **FR-007**: New or changed guide-enforcement behavior MUST include additive tests; existing tests change only with explicit rationale.
- **FR-008**: Development workflow MUST remain MCP-free and run in a dedicated feature worktree under `tmp/`.
- **FR-009**: Runtime/tooling baseline MUST remain Node.js 24.x LTS and NestJS 11.x LTS.
- **FR-010**: Official Node/NestJS capabilities and existing repository dependencies MUST be preferred over new third-party packages.

### Key Entities *(include if feature involves data)*

- **GuideRule**: A normalized policy statement derived from `README.md` and `CONTRIBUTING.md` with an identifier, source reference, and expected enforcement behavior.
- **ComplianceCheck**: An executable validation rule that maps one or more `GuideRule` entries to pass/fail logic and remediation output.
- **ValidationProfile**: A named command sequence defining required checks (build/lint/tests/contracts) for contributor and CI usage.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of non-compliant branch/worktree policy scenarios in contract tests fail with explicit remediation guidance.
- **SC-002**: The repository exposes one canonical pre-PR validation sequence and corresponding contract checks, and both stay in sync across CI runs.
- **SC-003**: Guide-compliance checks execute in under 30 seconds on local development machines excluding full integration test runtime.
- **SC-004**: CI continues to meet global `>= 95%` coverage while new guide-compliance checks for changed files achieve 100% line coverage.

## Assumptions

- The existing contributor guide documents in `README.md` and `CONTRIBUTING.md` are the source of truth for workflow policy.
- This feature focuses on enforcement and synchronization of guide policy, not on changing API/mobile product behavior.
- Existing build/lint/test commands in `package.json` remain the baseline validation commands unless explicitly changed as part of this feature.
- Worktree policy enforcement can use repository-local Git metadata and does not require external services.