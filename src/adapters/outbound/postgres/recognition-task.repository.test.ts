import { RecognitionTask } from '../../../domain/entities/recognition-task';
import { PostgresRecognitionTaskRepository } from './recognition-task.repository';

describe('PostgresRecognitionTaskRepository', () => {
  it('returns null when a task is not found', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
    };
    const repository = new PostgresRecognitionTaskRepository(pool as never);

    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('claims queued tasks using FIFO + lock semantics', async () => {
    const now = new Date('2026-05-30T10:00:00.000Z');
    const pool = {
      query: jest.fn().mockResolvedValueOnce({
        rows: [
          {
            id: 'rct_1',
            measurement_id: 'msr_1',
            status: 'processing',
            attempt_count: 1,
            last_error: null,
            available_at: now,
            started_at: now,
            completed_at: null,
            created_at: new Date('2026-05-30T09:58:00.000Z'),
            updated_at: now,
          },
        ],
      }),
    };
    const repository = new PostgresRecognitionTaskRepository(pool as never);

    const claimed = await repository.claimQueued(now, 4, 3);

    expect(pool.query).toHaveBeenCalledTimes(1);
    const [queryText, queryValues] = pool.query.mock.calls[0] as [
      string,
      unknown[],
    ];
    expect(queryText).toContain('FOR UPDATE SKIP LOCKED');
    expect(queryText).toContain('ORDER BY available_at ASC, created_at ASC');
    expect(queryText).toContain(
      "WHERE status = 'queued' AND available_at <= $1",
    );
    expect(queryText).toContain('attempt_count < $3');
    expect(queryValues).toEqual([now, 4, 3]);
    expect(claimed).toHaveLength(1);
    expect(claimed[0].id).toBe('rct_1');
    expect(claimed[0].status).toBe('processing');
    expect(claimed[0].attemptCount).toBe(1);
  });

  it('schedules retry with queued status and updated availability', async () => {
    const now = new Date('2026-05-30T10:00:00.000Z');
    const retryAt = new Date('2026-05-30T10:00:10.000Z');
    const pool = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
    };
    const repository = new PostgresRecognitionTaskRepository(pool as never);
    const owner = new RecognitionTask({
      id: 'rct_1',
      measurementId: 'msr_1',
      status: 'processing',
      attemptCount: 1,
      lastError: null,
      availableAt: now,
      startedAt: now,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await repository.scheduleRetry(owner, retryAt, 'temporary issue', now);

    expect(pool.query).toHaveBeenCalledTimes(1);
    const [queryText, queryValues] = pool.query.mock.calls[0] as [
      string,
      unknown[],
    ];
    expect(queryText).toContain("SET status = 'queued'");
    expect(queryText).toContain("status = 'processing'");
    expect(queryValues).toEqual([
      'rct_1',
      'temporary issue',
      retryAt,
      now,
      1,
      now,
    ]);
  });

  it('atomically recovers expired tasks and converges exhausted measurements', async () => {
    const cutoff = new Date('2026-05-30T10:00:00.000Z');
    const now = new Date('2026-05-30T10:10:00.000Z');
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const repository = new PostgresRecognitionTaskRepository(pool as never);

    await repository.recoverAbandoned(
      cutoff,
      now,
      3,
      'lease expired',
      'safe failure',
    );

    const [queryText, values] = pool.query.mock.calls[0] as [string, unknown[]];
    expect(queryText).toContain("status = 'processing' AND started_at <= $1");
    expect(queryText).toContain("attempt_count >= $3 THEN 'failed'");
    expect(queryText).toContain("measurement.status = 'recognizing'");
    expect(values).toEqual([cutoff, now, 3, 'lease expired', 'safe failure']);
  });

  it('guards completion by attempt count and lease start while persisting one result', async () => {
    const now = new Date('2026-05-30T10:00:00.000Z');
    const pool = {
      query: jest.fn().mockResolvedValue({ rows: [{ id: 'msr_1' }] }),
    };
    const repository = new PostgresRecognitionTaskRepository(pool as never);
    const owner = new RecognitionTask({
      id: 'rct_1',
      measurementId: 'msr_1',
      status: 'processing',
      attemptCount: 2,
      lastError: null,
      availableAt: now,
      startedAt: now,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    const measurement = {
      systolic: 120,
      diastolic: 80,
      pulse: 70,
      armSide: 'left',
    };

    await expect(
      repository.completeAttempt(owner, measurement as never, now),
    ).resolves.toBe(true);
    const [queryText, values] = pool.query.mock.calls[0] as [string, unknown[]];
    expect(queryText).toContain(
      "status = 'processing' AND attempt_count = $2 AND started_at = $3",
    );
    expect(queryText).toContain("measurement.status = 'recognizing'");
    expect(values).toEqual(['rct_1', 2, now, now, 120, 80, 70, 'left']);
  });

  it('saves and finds tasks', async () => {
    const now = new Date('2026-05-30T10:00:00.000Z');
    const task = new RecognitionTask({
      id: 'rct_1',
      measurementId: 'msr_1',
      status: 'queued',
      attemptCount: 0,
      lastError: null,
      availableAt: now,
      startedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: task.id,
              measurement_id: task.measurementId,
              status: task.status,
              attempt_count: task.attemptCount,
              last_error: task.lastError,
              available_at: task.availableAt,
              started_at: task.startedAt,
              completed_at: task.completedAt,
              created_at: task.createdAt,
              updated_at: task.updatedAt,
            },
          ],
        }),
    };
    const repository = new PostgresRecognitionTaskRepository(pool as never);

    await repository.save(task);
    const found = await repository.findById(task.id);

    expect(found?.id).toBe(task.id);
    expect(found?.status).toBe('queued');
  });
});
