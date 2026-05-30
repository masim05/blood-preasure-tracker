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
npm run test -- src/application/use-cases/process-recognition-task.use-case.ts
npm run test -- src/application/use-cases/measurement-review.use-cases.test.ts src/application/use-cases/mobile-api-error-branches.test.ts src/application/use-cases/mobile-api-not-found-branches.test.ts
npm run test:coverage
```

## 5. Regression checks

- Existing API contracts remain unchanged.
- Existing API tests remain unchanged unless explicitly required for corrected behavior.
- Worker behavior is fully implemented through local repo tooling (MCP-free).
