# Feature Specification: Background Recognition Worker

**Feature Branch**: `016-add-background-worker`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "background work: implement a background worker to process queued recognition tasks using the same logic as npm run cli -- predict, using proper NestJS background task infrastructure if it exists"

## Clarifications

### Session 2026-05-30

- Q: Which worker triggering model should process queued recognition tasks? -> A: Option B (polling worker at fixed intervals with claim-and-lock processing).
- Q: What retry policy should be used for failed recognition attempts? -> A: Option B (retry once, then fail).
- Q: How should queued tasks be selected per polling cycle? -> A: Option C (fixed-size FIFO batches), batch size configured from `.env` with default value 4.
- Q: What polling interval should the worker use? -> A: Interval is configured from `.env`; default is Option B (10 seconds).
- Q: When should the one allowed retry execute after a failed attempt? -> A: Option B (retry on the next polling cycle).
- Q: What status wording should be used for terminal outcomes? -> A: Use successful for success outcomes and failed for failure outcomes.

## Terminology

- **Successful** means task processing finished with recognized values persisted.
- **Failed** means task processing finished with an error and no successful recognition outcome.
- In implementation/storage terms, successful may map to existing persisted status values (for example `completed`) to stay compatible with the current schema.

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

### User Story 1 - Process Queued Tasks (Priority: P1)

As an authenticated user who uploads blood pressure measurement images, I need queued recognition tasks to be processed automatically in the background so that pending measurements become usable results without manual intervention.

**Why this priority**: Without automatic background processing, uploaded measurements stay pending and the core product workflow is blocked.

**Independent Test**: Can be fully tested by creating queued recognition tasks, running the worker flow, and confirming that queued tasks transition to a terminal state and produce recognition output.

**Acceptance Scenarios**:

1. **Given** one or more recognition tasks in queued state with valid input images, **When** background processing runs, **Then** each task is picked up and moved out of queued state.
2. **Given** a queued recognition task, **When** recognition finishes successfully, **Then** the task status is marked successful and recognized measurement values are stored for downstream use.

---

### User Story 2 - Handle Processing Failures Safely (Priority: P2)

As an operator, I need failed recognition attempts to be tracked without blocking other queued tasks so that bad inputs do not stall the whole queue.

**Why this priority**: Production queues always contain occasional invalid or corrupted inputs; one failure must not prevent other tasks from progressing.

**Independent Test**: Can be tested by providing one invalid task among valid queued tasks and verifying that invalid tasks transition to a failure state while valid tasks continue to complete.

**Acceptance Scenarios**:

1. **Given** a queued task with an unreadable or missing image, **When** the worker attempts recognition, **Then** that task is moved to a failure state with a recorded error reason.
2. **Given** a mix of valid and invalid queued tasks, **When** processing runs, **Then** invalid tasks fail independently and valid tasks still complete.

---

### User Story 3 - Preserve Consistent Results (Priority: P3)

As a product owner, I need background recognition outcomes to match the existing prediction behavior so that operational results remain consistent regardless of whether recognition is invoked manually or asynchronously.

**Why this priority**: Consistent recognition quality avoids regressions and keeps downstream reporting stable.

**Independent Test**: Can be tested by running the same image set through existing prediction flow and background flow, then comparing resulting measurements and statuses.

**Acceptance Scenarios**:

1. **Given** the same measurement image input, **When** it is recognized through both existing prediction flow and background worker flow, **Then** the recognized values are equivalent within existing business tolerances.
2. **Given** repeat worker runs, **When** a task has already reached a terminal state, **Then** duplicate final results are not created.

---

### Edge Cases

- Queue is empty when worker cycle runs.
- Recognition task references an image that no longer exists or cannot be decoded.
- Large backlog of queued tasks must be processed over multiple worker cycles.
- Worker restarts mid-processing; already-completed tasks remain terminal and queued tasks remain recoverable.
- A task is already in terminal state when scanned by the worker and must not be reprocessed.

## Architecture & Test Impact *(mandatory)*

- **Ports Affected**: Recognition task dequeue/claim port, recognition execution port, result persistence port.
- **Adapters Affected**: Background task scheduler/runner adapter, recognition task repository adapter, recognition execution adapter reuse from existing prediction flow.
- **Boundary Guarantee**: Queue orchestration and state transition rules remain in application/domain layers; framework-specific worker triggering stays in infrastructure adapters.
- **Node.js Version Baseline**: Latest active Node.js LTS.
- **NestJS Version Baseline**: Latest active NestJS LTS major.
- **Android Source Location**: N/A.
- **Kotlin Version Baseline**: N/A.
- **API Error UX**: N/A.
- **Localization Impact**: N/A.
- **Maestro Coverage**: N/A.
- **Mobile Unit Coverage**: N/A.
- **Dependency Selection Rationale**: Reuse existing project dependencies and prefer official NestJS scheduling/queue capabilities already present before introducing any third-party worker framework.
- **Existing Test Impact**: Existing API tests remain unchanged unless they currently assume recognition tasks stay queued.
- **New Test Coverage**: Add tests for successful queue processing, failure handling, terminal-state idempotency, and parity validation against existing prediction behavior.
- **Coverage Plan**: Add targeted unit and integration tests for new worker paths and preserve existing CI thresholds.
- **Worktree Path**: `tmp/015-background-worker`.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST run a fixed-interval polling worker that selects recognition tasks currently in queued state for background processing.
- **FR-002**: System MUST transition a queued task to a non-queued state once background processing begins to prevent indefinite pending status.
- **FR-003**: System MUST run recognition for each selected task using the same business recognition behavior as the existing prediction flow.
- **FR-004**: System MUST persist recognized measurement results for successfully processed tasks and mark those tasks as successful.
- **FR-005**: System MUST mark tasks as failed when recognition cannot be completed and store a diagnostic reason that supports troubleshooting.
- **FR-006**: System MUST continue processing remaining queued tasks even when one task fails.
- **FR-007**: System MUST prevent duplicate terminal outputs for tasks that have already completed successfully or failed.
- **FR-008**: System MUST preserve hexagonal boundaries: domain depends on ports only, adapters depend on domain interfaces.
- **FR-009**: Feature delivery MUST include new automated tests covering success path, failure path, queue progression, and idempotent behavior.
- **FR-010**: Existing API contracts and API test expectations MUST remain unchanged unless a required behavior correction is explicitly documented.
- **FR-011**: Development and validation for this feature MUST execute in a dedicated worktree under `tmp/`.
- **FR-012**: Runtime stack MUST target the latest active Node.js LTS and latest active NestJS LTS baseline used by the repository.
- **FR-013**: Dependency selection for background execution MUST prefer existing and official NestJS capabilities before adding new third-party infrastructure.
- **FR-014**: Polling execution MUST use claim-and-lock semantics to prevent duplicate concurrent processing of the same queued task.
- **FR-015**: When a recognition attempt fails, system MUST retry that task exactly one additional time; after the second failed attempt, task MUST transition to failed state.
- **FR-016**: Each polling cycle MUST claim queued tasks in FIFO order (oldest first) using a fixed batch size loaded from environment configuration; default batch size MUST be 4 when not specified.
- **FR-017**: Worker polling interval MUST be loaded from environment configuration, with a default interval of 10 seconds when not specified.
- **FR-018**: The single allowed retry attempt MUST be executed on the next polling cycle, not immediately within the same cycle.

### Key Entities *(include if feature involves data)*

- **Recognition Task**: Represents a queued/scheduled recognition workload for one uploaded measurement image, including lifecycle status, timestamps, and failure reason.
- **Measurement Image Artifact**: Represents the source image used for recognition and the linkage required to retrieve it during processing.
- **Recognition Result**: Represents extracted blood pressure and pulse values associated with a completed recognition task.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: At least 95% of valid queued recognition tasks move from queued to successful within 5 minutes during normal operating load.
- **SC-002**: 100% of invalid or unreadable queued tasks exit queued state and reach failed state with a recorded reason, without blocking other tasks.
- **SC-003**: For a controlled comparison dataset, background recognition outputs match existing prediction-flow outputs for at least 99% of samples.
- **SC-004**: Queue health checks show zero tasks stuck in queued state for more than 15 minutes after worker availability is restored.

## Assumptions

- Existing queued recognition task records already include enough information to locate the source measurement image and persist recognition output.
- Recognition behavior from the current prediction flow is considered the baseline for correctness and must be reused rather than redesigned.
- This feature focuses on background processing and task lifecycle handling; user-facing mobile flows are out of scope.
- Operational visibility will rely on existing logging and monitoring patterns already used in the backend services.
- A fixed polling interval and claim batch size will be configured in application settings and can be tuned without changing domain logic.
- Worker batch size configuration is sourced from environment variables, and if missing the system uses default batch size 4.
- Worker polling interval is sourced from environment variables, and if missing the system uses a default interval of 10 seconds.
