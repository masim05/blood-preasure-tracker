import { RecognitionTask } from '../../../domain/entities/recognition-task';
import type { LlmProviderPort } from '../../../application/ports/llm-provider.port';
import {
  InMemoryMeasurementImageStore,
  InMemoryMeasurementStore,
  InMemoryRecognitionTaskStore,
} from '../../../test-support/mobile-api-fakes';
import { jpegBytes } from '../../../test-support/image-bytes';
import { ProcessRecognitionTaskUseCase } from '../../../application/use-cases/process-recognition-task.use-case';
import { SubmitMeasurementImageUseCase } from '../../../application/use-cases/submit-measurement-image.use-case';
import { RecognitionTaskWorker } from './recognition-task.worker';

const now = new Date('2026-05-30T10:00:00.000Z');

describe('RecognitionTaskWorker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts and stops polling loop', async () => {
    const now = new Date('2026-05-30T10:00:00.000Z');
    const recognitionTasks = {
      claimQueued: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
    };
    const processRecognitionTask = {
      execute: jest.fn(),
    };
    const apiConfig = {
      load: jest.fn().mockReturnValue({ recognitionWorkerIntervalSeconds: 1, recognitionWorkerBatchSize: 4 }),
    };
    const envConfig = {
      load: jest.fn().mockReturnValue({ model: 'gpt-5.4-mini' }),
    };
    const worker = new RecognitionTaskWorker(
      recognitionTasks as never,
      processRecognitionTask as never,
      apiConfig as never,
      envConfig as never,
    );

    worker.onModuleInit();
    await jest.advanceTimersByTimeAsync(1000);

    expect(recognitionTasks.claimQueued).toHaveBeenCalledWith(expect.any(Date), 4);

    worker.onModuleDestroy();
    await jest.advanceTimersByTimeAsync(2000);

    expect(recognitionTasks.claimQueued).toHaveBeenCalledTimes(1);
  });

  it('allows destroy before init without errors', () => {
    const worker = new RecognitionTaskWorker(
      { claimQueued: jest.fn(), findById: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { load: jest.fn().mockReturnValue({ recognitionWorkerIntervalSeconds: 10, recognitionWorkerBatchSize: 4 }) } as never,
      { load: jest.fn().mockReturnValue({ model: 'test-model' }) } as never,
    );

    expect(() => worker.onModuleDestroy()).not.toThrow();
  });

  it('runs claimed tasks through process use case', async () => {
    const now = new Date('2026-05-30T10:00:00.000Z');
    const claimedTask = new RecognitionTask({
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
    const recognitionTasks = {
      claimQueued: jest.fn().mockResolvedValue([claimedTask]),
      findById: jest.fn().mockResolvedValue({ status: 'completed' }),
    };
    const processRecognitionTask = {
      execute: jest.fn().mockResolvedValue(undefined),
    };
    const apiConfig = {
      load: jest.fn().mockReturnValue({ recognitionWorkerIntervalSeconds: 10, recognitionWorkerBatchSize: 4 }),
    };
    const envConfig = {
      load: jest.fn().mockReturnValue({ model: 'test-model' }),
    };
    const worker = new RecognitionTaskWorker(
      recognitionTasks as never,
      processRecognitionTask as never,
      apiConfig as never,
      envConfig as never,
    );

    await worker.runCycle(now);

    expect(recognitionTasks.claimQueued).toHaveBeenCalledWith(now, 4);
    expect(processRecognitionTask.execute).toHaveBeenCalledWith({
      taskId: 'rct_1',
      model: 'test-model',
      now,
    });
  });

  it('skips cycle when another cycle is already running', async () => {
    const recognitionTasks = {
      claimQueued: jest.fn(),
      findById: jest.fn(),
    };
    const worker = new RecognitionTaskWorker(
      recognitionTasks as never,
      { execute: jest.fn() } as never,
      { load: jest.fn().mockReturnValue({ recognitionWorkerIntervalSeconds: 10, recognitionWorkerBatchSize: 4 }) } as never,
      { load: jest.fn().mockReturnValue({ model: 'test-model' }) } as never,
    );
    (worker as unknown as { isRunning: boolean }).isRunning = true;

    await worker.runCycle(now);

    expect(recognitionTasks.claimQueued).not.toHaveBeenCalled();
  });

  it('continues cycle and counts failures when task execution throws', async () => {
    const claimedTask = new RecognitionTask({
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
    const recognitionTasks = {
      claimQueued: jest.fn().mockResolvedValue([claimedTask]),
      findById: jest.fn().mockResolvedValue({ status: 'failed' }),
    };
    const processRecognitionTask = {
      execute: jest.fn().mockRejectedValue(new Error('boom')),
    };
    const worker = new RecognitionTaskWorker(
      recognitionTasks as never,
      processRecognitionTask as never,
      { load: jest.fn().mockReturnValue({ recognitionWorkerIntervalSeconds: 10, recognitionWorkerBatchSize: 4 }) } as never,
      { load: jest.fn().mockReturnValue({ model: 'test-model' }) } as never,
    );

    await worker.runCycle(now);

    expect(processRecognitionTask.execute).toHaveBeenCalledTimes(1);
  });

  it('logs unknown error text when thrown value is not an Error', async () => {
    const claimedTask = new RecognitionTask({
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
    const recognitionTasks = {
      claimQueued: jest.fn().mockResolvedValue([claimedTask]),
      findById: jest.fn().mockResolvedValue({ status: 'failed' }),
    };
    const processRecognitionTask = {
      execute: jest.fn().mockRejectedValue('boom-string'),
    };
    const worker = new RecognitionTaskWorker(
      recognitionTasks as never,
      processRecognitionTask as never,
      { load: jest.fn().mockReturnValue({ recognitionWorkerIntervalSeconds: 10, recognitionWorkerBatchSize: 4 }) } as never,
      { load: jest.fn().mockReturnValue({ model: 'test-model' }) } as never,
    );

    await worker.runCycle(now);

    expect(processRecognitionTask.execute).toHaveBeenCalledTimes(1);
  });

  it('processes valid tasks while invalid tasks retry then fail', async () => {
    const measurements = new InMemoryMeasurementStore();
    const images = new InMemoryMeasurementImageStore();
    const tasks = new InMemoryRecognitionTaskStore();
    await new SubmitMeasurementImageUseCase(measurements, images, tasks).execute({
      userId: 'usr_1',
      contentType: 'image/jpeg',
      originalName: 'bp.jpg',
      data: jpegBytes,
      now,
    });
    const validTaskId = [...tasks.tasks.keys()][0];
    await tasks.save(
      new RecognitionTask({
        id: 'missing-image-task',
        measurementId: 'missing-measurement',
        status: 'queued',
        attemptCount: 0,
        lastError: null,
        availableAt: now,
        startedAt: null,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      }),
    );
    const provider: LlmProviderPort = {
      provider: 'test',
      infer: jest.fn().mockResolvedValue({
        hand: 'left',
        systolic: 122,
        diastolic: 82,
        pulse: 72,
        confidence: 0.9,
        uncertainFields: [],
        rawNotes: null,
      }),
    };
    const worker = new RecognitionTaskWorker(
      tasks,
      new ProcessRecognitionTaskUseCase(tasks, measurements, images, provider),
      {
        load: jest
          .fn()
          .mockReturnValue({ recognitionWorkerIntervalSeconds: 10, recognitionWorkerBatchSize: 4 }),
      } as never,
      {
        load: jest.fn().mockReturnValue({ model: 'test-model' }),
      } as never,
    );

    await worker.runCycle(now);
    expect(tasks.tasks.get(validTaskId)?.status).toBe('completed');
    expect(tasks.tasks.get('missing-image-task')?.status).toBe('queued');

    await worker.runCycle(now);
    expect(tasks.tasks.get('missing-image-task')?.status).toBe('failed');
  });

  it('does not invoke provider for terminal tasks', async () => {
    const measurements = new InMemoryMeasurementStore();
    const images = new InMemoryMeasurementImageStore();
    const tasks = new InMemoryRecognitionTaskStore();
    await tasks.save(
      new RecognitionTask({
        id: 'terminal-task',
        measurementId: 'msr_1',
        status: 'completed',
        attemptCount: 2,
        lastError: null,
        availableAt: now,
        startedAt: now,
        completedAt: now,
        createdAt: now,
        updatedAt: now,
      }),
    );
    const provider: LlmProviderPort = {
      provider: 'test',
      infer: jest.fn(),
    };
    const worker = new RecognitionTaskWorker(
      tasks,
      new ProcessRecognitionTaskUseCase(tasks, measurements, images, provider),
      {
        load: jest
          .fn()
          .mockReturnValue({ recognitionWorkerIntervalSeconds: 10, recognitionWorkerBatchSize: 4 }),
      } as never,
      {
        load: jest.fn().mockReturnValue({ model: 'test-model' }),
      } as never,
    );

    await worker.runCycle(now);

    expect(provider.infer).not.toHaveBeenCalled();
  });
});
