# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`

**Created**: [DATE]

**Status**: Draft

**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Architecture & Test Impact *(mandatory)*

- **Ports Affected**: [List domain ports introduced/changed, or N/A]
- **Adapters Affected**: [List concrete adapters introduced/changed, or N/A]
- **Boundary Guarantee**: [Explain how domain logic stays framework-agnostic]
- **Node.js Version Baseline**: [Latest active LTS version targeted]
- **NestJS Version Baseline**: [Latest active LTS major targeted]
- **Android Source Location**: [`mobile/android` when Android mobile app is affected, otherwise N/A]
- **Kotlin Version Baseline**: [Latest active LTS Kotlin when Android mobile app is affected, otherwise N/A]
- **API Error UX**: [How every API error returned to Android/mobile users is shown in the UI, otherwise N/A]
- **Maestro Coverage**: [Happy-path Maestro test per Android mobile user story, otherwise N/A]
- **Mobile Unit Coverage**: [How Android unit tests meet the `>= 95%` CI gate, otherwise N/A]
- **Dependency Selection Rationale**: [Official Node/NestJS modules chosen first,
  or justification for third-party choice]
- **Existing Test Impact**: [State "No changes" or justify required updates]
- **New Test Coverage**: [List the new unit/integration tests that will be added]
- **Coverage Plan**: [How CI `>= 95%` is preserved and how 100% is pursued where feasible]
- **Worktree Path**: [Feature worktree path under `tmp/`]

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST [specific capability, e.g., "allow users to create accounts"]
- **FR-002**: System MUST [specific capability, e.g., "validate email addresses"]
- **FR-003**: Users MUST be able to [key interaction, e.g., "reset their password"]
- **FR-004**: System MUST [data requirement, e.g., "persist user preferences"]
- **FR-005**: System MUST [behavior, e.g., "log all security events"]
- **FR-006**: Implementation MUST preserve hexagonal boundaries: domain depends on
  ports only, adapters depend on domain interfaces.
- **FR-007**: Each new feature MUST add new tests; existing tests MUST remain
  unchanged unless the specification documents why a change is required.
- **FR-008**: Development workflow MUST remain MCP-free and execute in a dedicated
  feature worktree under `tmp/`.
- **FR-009**: Runtime stack MUST target the latest active Node.js LTS and latest
  active NestJS LTS.
- **FR-010**: Dependency decisions MUST prefer official Node.js/NestJS modules;
  third-party additions require explicit justification.
- **FR-011**: Android mobile app source MUST live under `mobile/android` when
  Android code is added or changed.
- **FR-012**: Android mobile implementation MUST target the latest active LTS
  Kotlin release.
- **FR-013**: Android mobile UI MUST show every API error returned by the API to
  the user.
- **FR-014**: Every Android mobile user story MUST include a happy-path Maestro
  flow.
- **FR-015**: Android mobile code MUST maintain unit-test coverage of at least
  95% in CI.

*Example of marking unclear requirements:*

- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction metric, e.g., "90% of users successfully complete primary task on first attempt"]
- **SC-004**: [Business metric, e.g., "Reduce support tickets related to [X] by 50%"]

## Assumptions

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right assumptions based on reasonable defaults
  chosen when the feature description did not specify certain details.
-->

- [Assumption about target users, e.g., "Users have stable internet connectivity"]
- [Assumption about scope boundaries, e.g., "Mobile support is out of scope for v1"]
- [Assumption about data/environment, e.g., "Existing authentication system will be reused"]
- [Dependency on existing system/service, e.g., "Requires access to the existing user profile API"]
