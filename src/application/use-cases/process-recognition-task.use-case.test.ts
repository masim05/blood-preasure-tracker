import { RecognitionTask } from '../../domain/entities/recognition-task';
import type { LlmProviderPort } from '../ports/llm-provider.port';
import {
  InMemoryMeasurementImageStore,
  InMemoryMeasurementStore,
  InMemoryRecognitionTaskStore,
} from '../../test-support/mobile-api-fakes';
import { jpegBytes } from '../../test-support/image-bytes';
import { SubmitMeasurementImageUseCase } from './submit-measurement-image.use-case';
import { ProcessRecognitionTaskUseCase } from './process-recognition-task.use-case';

const now = new Date('2026-05-30T10:00:00.000Z');

describe('ProcessRecognitionTaskUseCase', () => {
  const retryAt = new Date('2026-05-30T10:00:10.000Z');

  it('marks queued task completed when recognition succeeds', async () => {
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
    const taskId = [...tasks.tasks.keys()][0];
    const provider: LlmProviderPort = {
      provider: 'test',
      infer: jest.fn().mockResolvedValue({
        hand: 'left',
        systolic: 120,
        diastolic: 80,
        pulse: 70,
        confidence: 0.9,
        uncertainFields: [],
        rawNotes: null,
      }),
    };

    await new ProcessRecognitionTaskUseCase(tasks, measurements, images, provider).execute({
      taskId,
      model: 'test-model',
      now,
      retryAt,
    });

    expect(tasks.tasks.get(taskId)?.status).toBe('completed');
    expect([...measurements.measurements.values()][0].status).toBe('recognized');
  });

  it('requeues task after first failed recognition attempt', async () => {
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
    const taskId = [...tasks.tasks.keys()][0];
    const provider: LlmProviderPort = {
      provider: 'test',
      infer: jest.fn().mockResolvedValue({
        hand: null,
        systolic: null,
        diastolic: null,
        pulse: null,
        confidence: null,
        uncertainFields: [],
        rawNotes: null,
      }),
    };

    await new ProcessRecognitionTaskUseCase(tasks, measurements, images, provider).execute({
      taskId,
      model: 'test-model',
      now,
      retryAt,
    });

    expect(tasks.tasks.get(taskId)?.status).toBe('queued');
    expect(tasks.tasks.get(taskId)?.attemptCount).toBe(1);
    expect(tasks.tasks.get(taskId)?.availableAt).toEqual(retryAt);
  });

  it('marks task failed after second failed attempt', async () => {
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
    const taskId = [...tasks.tasks.keys()][0];
    const provider: LlmProviderPort = {
      provider: 'test',
      infer: jest.fn().mockResolvedValue({
        hand: null,
        systolic: null,
        diastolic: null,
        pulse: null,
        confidence: null,
        uncertainFields: [],
        rawNotes: null,
      }),
    };
    const useCase = new ProcessRecognitionTaskUseCase(tasks, measurements, images, provider);

    await useCase.execute({ taskId, model: 'test-model', now, retryAt });
    await useCase.execute({ taskId, model: 'test-model', now, retryAt });

    expect(tasks.tasks.get(taskId)?.status).toBe('failed');
    expect([...measurements.measurements.values()][0].status).toBe('failed');
  });

  it('skips terminal tasks without invoking provider', async () => {
    const measurements = new InMemoryMeasurementStore();
    const images = new InMemoryMeasurementImageStore();
    const tasks = new InMemoryRecognitionTaskStore();
    const task = new RecognitionTask({
      id: 'rct_1',
      measurementId: 'msr_1',
      status: 'completed',
      attemptCount: 1,
      lastError: null,
      availableAt: now,
      startedAt: now,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    await tasks.save(task);
    const provider: LlmProviderPort = {
      provider: 'test',
      infer: jest.fn(),
    };

    await new ProcessRecognitionTaskUseCase(tasks, measurements, images, provider).execute({
      taskId: task.id,
      model: 'test-model',
      now,
      retryAt,
    });

    expect(provider.infer).not.toHaveBeenCalled();
    expect(tasks.tasks.get(task.id)?.status).toBe('completed');
  });

  it('skips already failed tasks without invoking provider', async () => {
    const measurements = new InMemoryMeasurementStore();
    const images = new InMemoryMeasurementImageStore();
    const tasks = new InMemoryRecognitionTaskStore();
    const task = new RecognitionTask({
      id: 'rct_failed',
      measurementId: 'msr_1',
      status: 'failed',
      attemptCount: 2,
      lastError: 'broken',
      availableAt: now,
      startedAt: now,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    await tasks.save(task);
    const provider: LlmProviderPort = {
      provider: 'test',
      infer: jest.fn(),
    };

    await new ProcessRecognitionTaskUseCase(tasks, measurements, images, provider).execute({
      taskId: task.id,
      model: 'test-model',
      now,
      retryAt,
    });

    expect(provider.infer).not.toHaveBeenCalled();
    expect(tasks.tasks.get(task.id)?.status).toBe('failed');
  });

  it('requeues after provider throws on first attempt', async () => {
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
    const taskId = [...tasks.tasks.keys()][0];
    const provider: LlmProviderPort = {
      provider: 'test',
      infer: jest.fn().mockRejectedValue('provider-down'),
    };

    await new ProcessRecognitionTaskUseCase(tasks, measurements, images, provider).execute({
      taskId,
      model: 'test-model',
      now,
      retryAt,
    });

    expect(tasks.tasks.get(taskId)?.status).toBe('queued');
    expect(tasks.tasks.get(taskId)?.lastError).toBe('Recognition provider failure');
    expect(tasks.tasks.get(taskId)?.availableAt).toEqual(retryAt);
  });

  it('uses the thrown Error message when the provider rejects with an Error', async () => {
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
    const taskId = [...tasks.tasks.keys()][0];
    const provider: LlmProviderPort = {
      provider: 'test',
      infer: jest.fn().mockRejectedValue(new Error('provider exploded')),
    };

    await new ProcessRecognitionTaskUseCase(tasks, measurements, images, provider).execute({
      taskId,
      model: 'test-model',
      now,
      retryAt,
    });

    expect(tasks.tasks.get(taskId)?.status).toBe('queued');
    expect(tasks.tasks.get(taskId)?.lastError).toBe('provider exploded');
  });

  it('defaults retryAt to now when not provided', async () => {
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
    const taskId = [...tasks.tasks.keys()][0];
    const provider: LlmProviderPort = {
      provider: 'test',
      infer: jest.fn().mockResolvedValue({
        hand: null,
        systolic: null,
        diastolic: null,
        pulse: null,
        confidence: null,
        uncertainFields: [],
        rawNotes: null,
      }),
    };

    await new ProcessRecognitionTaskUseCase(tasks, measurements, images, provider).execute({
      taskId,
      model: 'test-model',
    });

    expect(tasks.tasks.get(taskId)?.availableAt.getTime()).toBeGreaterThanOrEqual(now.getTime());
  });

  it('processes a task already in processing state without incrementing attempts', async () => {
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
    const task = [...tasks.tasks.values()][0];
    await tasks.save(
      new RecognitionTask({
        ...task.toJSON(),
        status: 'processing',
        attemptCount: 1,
        startedAt: now,
        updatedAt: now,
      }),
    );
    const provider: LlmProviderPort = {
      provider: 'test',
      infer: jest.fn().mockResolvedValue({
        hand: 'left',
        systolic: 119,
        diastolic: 77,
        pulse: 65,
        confidence: 0.9,
        uncertainFields: [],
        rawNotes: null,
      }),
    };

    await new ProcessRecognitionTaskUseCase(tasks, measurements, images, provider).execute({
      taskId: task.id,
      model: 'test-model',
      now,
      retryAt,
    });

    expect(tasks.tasks.get(task.id)?.status).toBe('completed');
    expect(tasks.tasks.get(task.id)?.attemptCount).toBe(1);
  });
});
