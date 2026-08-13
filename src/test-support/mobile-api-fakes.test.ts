import { RecognitionTask } from '../domain/entities/recognition-task';
import { InMemoryRecognitionTaskStore } from './mobile-api-fakes';

describe('InMemoryRecognitionTaskStore', () => {
  it('claims queued tasks in FIFO order by availableAt then createdAt', async () => {
    const now = new Date('2026-05-30T10:00:00.000Z');
    const store = new InMemoryRecognitionTaskStore();

    await store.save(
      new RecognitionTask({
        id: 'late',
        measurementId: 'msr_late',
        status: 'queued',
        attemptCount: 0,
        lastError: null,
        availableAt: now,
        startedAt: null,
        completedAt: null,
        createdAt: new Date('2026-05-30T09:59:10.000Z'),
        updatedAt: now,
      }),
    );
    await store.save(
      new RecognitionTask({
        id: 'early',
        measurementId: 'msr_early',
        status: 'queued',
        attemptCount: 0,
        lastError: null,
        availableAt: now,
        startedAt: null,
        completedAt: null,
        createdAt: new Date('2026-05-30T09:59:00.000Z'),
        updatedAt: now,
      }),
    );

    const claimed = await store.claimQueued(now, 2);

    expect(claimed.map((task) => task.id)).toEqual(['early', 'late']);
  });
});

describe('InMemoryRecognitionTaskStore abandoned attempt recovery', () => {
  const cycleAt = new Date('2026-05-30T10:10:00.000Z');
  const cutoff = new Date('2026-05-30T10:00:00.000Z');

  function processing(
    id: string,
    attemptCount: number,
    startedAt: Date,
  ): RecognitionTask {
    return new RecognitionTask({
      id,
      measurementId: `measurement-${id}`,
      status: 'processing',
      attemptCount,
      lastError: null,
      availableAt: startedAt,
      startedAt,
      completedAt: null,
      createdAt: startedAt,
      updatedAt: startedAt,
    });
  }

  it('respects an active lease and recovers a task exactly at the cutoff', async () => {
    const store = new InMemoryRecognitionTaskStore();
    await store.save(processing('active', 1, new Date(cutoff.getTime() + 1)));
    await store.save(processing('expired', 1, cutoff));

    await store.recoverAbandoned(
      cutoff,
      cycleAt,
      3,
      'lease expired',
      'safe failure',
    );

    expect(store.tasks.get('active')?.status).toBe('processing');
    expect(store.tasks.get('expired')).toMatchObject({
      status: 'queued',
      attemptCount: 1,
      startedAt: null,
      availableAt: cycleAt,
      lastError: 'lease expired',
    });
    const claimed = await store.claimQueued(cycleAt, 1, 3);
    expect(claimed[0]).toMatchObject({
      id: 'expired',
      status: 'processing',
      attemptCount: 2,
    });
  });

  it('fails an exhausted lease and recovery is idempotent', async () => {
    const store = new InMemoryRecognitionTaskStore();
    await store.save(processing('exhausted', 3, cutoff));
    await store.recoverAbandoned(
      cutoff,
      cycleAt,
      3,
      'lease expired',
      'safe failure',
    );
    const first = store.tasks.get('exhausted');
    await store.recoverAbandoned(
      cutoff,
      new Date(cycleAt.getTime() + 1_000),
      3,
      'lease expired',
      'safe failure',
    );
    expect(store.tasks.get('exhausted')).toEqual(first);
    expect(first).toMatchObject({ status: 'failed', completedAt: cycleAt });
    await expect(store.claimQueued(cycleAt, 1, 3)).resolves.toEqual([]);
  });

  it('rejects writes from an expired owner after a newer attempt is claimed', async () => {
    const store = new InMemoryRecognitionTaskStore();
    const oldOwner = processing('late', 1, cutoff);
    await store.save(oldOwner);
    await store.recoverAbandoned(
      cutoff,
      cycleAt,
      3,
      'lease expired',
      'safe failure',
    );
    await store.claimQueued(cycleAt, 1, 3);

    await expect(
      store.scheduleRetry(oldOwner, cycleAt, 'late failure', cycleAt),
    ).resolves.toBe(false);
    expect(store.tasks.get('late')).toMatchObject({
      status: 'processing',
      attemptCount: 2,
    });
  });
});
