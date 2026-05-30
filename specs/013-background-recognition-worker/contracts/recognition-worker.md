# Contract: Background Recognition Worker

## Scope

Defines internal behavior contract for automatic processing of queued recognition tasks.

## Configuration Contract

- `RECOGNITION_WORKER_INTERVAL_SECONDS`
  - Type: positive integer
  - Default: `10`
  - Meaning: polling cadence in seconds
- `RECOGNITION_WORKER_BATCH_SIZE`
  - Type: positive integer
  - Default: `4`
  - Meaning: maximum number of tasks claimed per cycle

## Processing Contract

- Only tasks with `status = queued` and `available_at <= now` are eligible for claim.
- Eligible tasks are claimed in FIFO order by `available_at` then `created_at`.
- Claiming operation must prevent duplicate concurrent claims.
- Claimed tasks transition to `processing` and increment `attempt_count`.

## Retry and Terminal State Contract

- On first failed attempt (`attempt_count` becomes `1`):
  - task returns to `queued`
  - `available_at` is set for next polling cycle
  - `last_error` is updated
- On second failed attempt (`attempt_count` becomes `2`):
  - task transitions to `failed`
  - `completed_at` is set
  - task is terminal and no longer eligible for claim
- On success:
  - task transitions to `successful` (or equivalent persisted success status such as `completed`)
  - `completed_at` is set
  - recognized measurement values are persisted through existing domain policies

## Observability Contract

- Worker logs claim batch size and cycle outcome counts (`claimed`, `completed`, `retried`, `failed`).
- Failure logs include `task_id` and sanitized error summary.

## Non-Goals

- No API endpoint contract changes are introduced by this feature.
- No Android/mobile contract changes are introduced by this feature.
