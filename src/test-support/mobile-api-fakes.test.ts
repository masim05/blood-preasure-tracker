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