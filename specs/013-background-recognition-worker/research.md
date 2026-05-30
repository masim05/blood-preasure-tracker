# Research: Background Recognition Worker

## Decision 1: Use NestJS schedule-based polling worker

- Decision: Implement background processing as a NestJS-managed polling worker triggered every configured interval, instead of requiring explicit HTTP/CLI invocation for each task.
- Rationale: The repository already uses NestJS dependency wiring in the API module; a framework-managed polling loop keeps worker lifecycle consistent with app startup/shutdown, and satisfies the requirement for automatic processing.
- Alternatives considered:
  - Manual trigger only: rejected because queued tasks remain pending without an external runner.
  - Third-party queue framework: rejected for now because official NestJS mechanisms should be preferred first under constitution dependency policy.

## Decision 2: Claim tasks with FIFO + DB-level lock semantics

- Decision: Claim queued tasks in FIFO order using database-side locking semantics (`FOR UPDATE SKIP LOCKED`) and immediately transition claimed rows to processing.
- Rationale: Prevents duplicate claims across concurrent worker instances, supports fairness (oldest first), and aligns with the existing PostgreSQL-backed task store.
- Alternatives considered:
  - In-memory lock map: rejected because it does not protect against multi-process workers.
  - Simple `SELECT ... LIMIT` without lock: rejected because concurrent workers can process the same task.

## Decision 3: Keep recognition logic in existing use case path

- Decision: Reuse the existing `ProcessRecognitionTaskUseCase` as the recognition execution core and add orchestration around task claiming/retry scheduling.
- Rationale: The current use case already enforces measurement state transitions and LLM response handling; reuse minimizes behavior drift from existing `npm run cli -- predict` recognition semantics.
- Alternatives considered:
  - New parallel recognition implementation: rejected due to higher regression risk and duplicate business rules.

## Decision 4: Retry policy and availability timing

- Decision: On failure, allow exactly one retry on the next polling cycle; after second failure, mark task failed terminally.
- Rationale: Matches clarified requirements, limits repeated load, and ensures failed tasks are observable and bounded.
- Alternatives considered:
  - No retry: rejected due to lower resilience for transient failures.
  - Multiple retries with backoff: rejected because requirement explicitly fixed retry count to one.

## Decision 5: Environment-driven worker tuning

- Decision: Introduce environment-backed config values for poll interval and batch size with defaults of 10 seconds and 4.
- Rationale: Allows operations tuning without code changes while preserving deterministic defaults in all environments.
- Alternatives considered:
  - Hardcoded constants: rejected because tuning would require deployment changes.
  - Database-stored settings: rejected as unnecessary complexity for current scope.
