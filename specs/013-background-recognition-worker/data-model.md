# Data Model: Background Recognition Worker

## Entity: RecognitionTask

- Purpose: Represents asynchronous recognition workload for a measurement image.
- Source: Existing `recognition_tasks` table and `RecognitionTask` domain entity.

### Fields

- `id` (string, primary identifier)
- `measurementId` (string, FK to measurement)
- `status` (`queued` | `processing` | `successful` | `failed` in feature terminology; persisted success value may remain `completed` for compatibility)
- `attemptCount` (integer, starts at 0)
- `lastError` (string | null)
- `availableAt` (timestamp when task is eligible to be claimed)
- `startedAt` (timestamp | null)
- `completedAt` (timestamp | null)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

### Validation Rules

- `attemptCount` cannot be negative.
- `status` must be one of allowed lifecycle states.
- Task cannot move from terminal states (`successful`/`failed`) back to `queued` or `processing`.
- Claim operation can select only tasks where `status = queued` and `availableAt <= now`.

### State Transitions

- `queued` -> `processing`: when worker claims task in a polling cycle.
- `processing` -> `successful`: recognition succeeded and measurement values persisted.
- `processing` -> `queued`: first failure path; retry scheduled for next polling cycle (by updating `availableAt` and status).
- `processing` -> `failed`: second failure path or unrecoverable input issue.

## Entity: Measurement

- Purpose: User-visible blood-pressure record whose recognition lifecycle is driven by task processing.
- Relevant statuses in this feature:
  - `pending`: awaiting recognition
  - `recognizing`: currently being processed
  - `recognized`: machine values available
  - `saved`: user-confirmed values

### Invariants for this feature

- Measurement remains `pending` until task processing begins.
- On successful recognition, measurement transitions to recognized values through existing domain policy.
- On terminal recognition failure, measurement captures a user-visible recognition error.

## Entity: WorkerRuntimeConfig

- Purpose: Environment-backed configuration for worker behavior.

### Fields

- `recognitionWorkerIntervalSeconds` (integer, default `10`)
- `recognitionWorkerBatchSize` (integer, default `4`)

### Validation Rules

- Values must be positive integers.
- Defaults are applied when env vars are unset.

## Relationships

- One `RecognitionTask` belongs to exactly one `Measurement`.
- One `Measurement` has exactly one current `RecognitionTask` for the initial upload flow.
- `WorkerRuntimeConfig` affects task-claim cadence and throughput, but does not alter business correctness rules.
