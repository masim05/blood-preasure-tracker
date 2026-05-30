# Quickstart: Background Recognition Worker

## Prerequisites

- Work in dedicated worktree: `tmp/015-background-worker`
- Install dependencies: `npm install`
- Ensure `.env` contains at least:
  - `DATABASE_URL`
  - `OPENAI_API_KEY`
- Optional worker tuning variables:
  - `RECOGNITION_WORKER_INTERVAL_SECONDS` (default `10`)
  - `RECOGNITION_WORKER_BATCH_SIZE` (default `4`)

## 1. Prepare database and sample queued tasks

```bash
npm run db:clean
npm run db:init
```

Create or upload measurement images through existing API flows so `recognition_tasks` rows are queued.

## 2. Start API with worker enabled

```bash
npm run api
```

Expected behavior:
- Worker polls every configured interval.
- Up to configured batch size queued tasks are claimed FIFO and processed.
- First failure is retried on the next cycle.
- Second failure transitions task to `failed`.

## 3. Verify queue progression

```sql
select count(*) from recognition_tasks where status = 'queued';
select count(*) from recognition_tasks where status = 'processing';
select count(*) from recognition_tasks where status = 'completed';
select count(*) from recognition_tasks where status = 'failed';
```

Expected:
- Queued count decreases over time under healthy processing.
- Completed/failed counts increase as tasks exit queue.

## 4. Run targeted tests

```bash
npx jest --runInBand --runTestsByPath src/application/use-cases/process-recognition-task.use-case.test.ts src/adapters/inbound/worker/recognition-task.worker.test.ts
npm run test -- src/application/use-cases/measurement-review.use-cases.test.ts src/application/use-cases/mobile-api-error-branches.test.ts src/application/use-cases/mobile-api-not-found-branches.test.ts
npm run test:coverage
```

## 5. SC-001 SLA verification (`>=95%` success in 5 minutes)

1. Seed a repeatable dataset of valid queued tasks (for example 20 tasks) and record the start time.
2. Start the API worker using default interval and batch size (`10s`, `4`) or your tuned values.
3. After 5 minutes, compute completion ratio:

```sql
select
  sum(case when status = 'completed' then 1 else 0 end)::float / nullif(count(*), 0) as completed_ratio
from recognition_tasks
where created_at >= now() - interval '5 minutes';
```

4. Save the query result and run configuration used for the run in your execution notes.

Pass condition:
- `completed_ratio >= 0.95`

## 6. SC-004 queue-age health-check verification

Use a queue-age metric/query to detect tasks stuck queued for more than 15 minutes:

```sql
select count(*) as queued_over_15m
from recognition_tasks
where status = 'queued'
  and now() - available_at > interval '15 minutes';
```

Pass condition:
- `queued_over_15m = 0` after worker availability is restored.
- Capture this query output in execution notes alongside worker configuration.

## 7. Regression checks

- Existing API contracts remain unchanged.
- Existing API tests remain unchanged unless explicitly required for corrected behavior.
- Worker behavior is fully implemented through local repo tooling (MCP-free).
