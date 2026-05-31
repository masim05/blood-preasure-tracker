import { Measurement } from '../../domain/entities/measurement';
import { RecognitionTask } from '../../domain/entities/recognition-task';
import { GetMeasurementDetailUseCase } from './get-measurement-detail.use-case';
import { GetMeasurementImageUseCase } from './get-measurement-image.use-case';
import { ListMeasurementsUseCase } from './list-measurements.use-case';
import { LLM_PROVIDER, ProcessRecognitionTaskUseCase } from './process-recognition-task.use-case';
import { OverrideMeasurementUseCase } from './override-measurement.use-case';
import { SaveMeasurementUseCase } from './save-measurement.use-case';
import { SubmitMeasurementImageUseCase } from './submit-measurement-image.use-case';
import type { LlmProviderPort } from '../ports/llm-provider.port';
import {
  InMemoryMeasurementImageStore,
  InMemoryMeasurementStore,
  InMemoryRecognitionTaskStore,
} from '../../test-support/mobile-api-fakes';
import { jpegBytes, pngBytes } from '../../test-support/image-bytes';

void LLM_PROVIDER;

const now = new Date('2026-05-27T12:00:00.000Z');

function savedMeasurement(id: string, userId = 'usr_1'): Measurement {
  return new Measurement({
    id,
    userId,
    status: 'saved',
    systolic: 120,
    diastolic: 80,
    pulse: 68,
    armSide: 'left',
    measurementTime: now,
    imageId: 'img_1',
    recognitionError: null,
    savedAt: now,
    createdAt: now,
    updatedAt: now,
  });
}

describe('measurement use cases', () => {
  it('submits a valid image, stores it, and schedules recognition', async () => {
    const measurements = new InMemoryMeasurementStore();
    const images = new InMemoryMeasurementImageStore();
    const tasks = new InMemoryRecognitionTaskStore();
    const output = await new SubmitMeasurementImageUseCase(measurements, images, tasks).execute({
      userId: 'usr_1',
      contentType: 'image/jpeg',
      originalName: 'bp.jpg',
      data: jpegBytes,
      now,
    });

    expect(output.status).toBe('pending');
    expect(measurements.measurements.size).toBe(1);
    expect(images.images.size).toBe(1);
    expect(tasks.tasks.size).toBe(1);
  });

  it('rejects invalid image uploads before persistence', async () => {
    const measurements = new InMemoryMeasurementStore();
    await expect(
      new SubmitMeasurementImageUseCase(
        measurements,
        new InMemoryMeasurementImageStore(),
        new InMemoryRecognitionTaskStore(),
      ).execute({ userId: 'usr_1', contentType: 'image/gif', originalName: 'bp.gif', data: Buffer.from('x'), now }),
    ).rejects.toThrow('image must be JPEG or PNG');
    expect(measurements.measurements.size).toBe(0);
  });

  it('returns detail, owner-protected image, saved history, and save confirmation', async () => {
    const measurements = new InMemoryMeasurementStore();
    const images = new InMemoryMeasurementImageStore();
    const recognized = new Measurement({
      ...savedMeasurement('msr_1').toJSON(),
      status: 'recognized',
      savedAt: null,
    });
    await measurements.save(recognized);
    await images.save({
      id: 'img_1',
      measurementId: 'msr_1',
      contentType: 'image/png',
      data: pngBytes,
      originalName: 'bp.png',
      createdAt: now,
    });

    expect(await new GetMeasurementDetailUseCase(measurements, images).execute({ userId: 'usr_1', measurementId: 'msr_1' })).toMatchObject({
      id: 'msr_1',
      status: 'recognized',
      imageUrl: '/api/v1/measurements/msr_1/image',
    });
    await expect(new GetMeasurementImageUseCase(measurements, images).execute({ userId: 'other', measurementId: 'msr_1' })).rejects.toThrow('Measurement was not found');

    const saved = await new SaveMeasurementUseCase(measurements).execute({ userId: 'usr_1', measurementId: 'msr_1', now });
    expect(saved.status).toBe('saved');

    const history = await new ListMeasurementsUseCase(measurements).execute({ userId: 'usr_1', page: 1, pageSize: 20 });
    expect(history.items).toHaveLength(1);
    expect(history.items[0]).not.toHaveProperty('imageUrl');
  });

  it('overrides recognized readings before saving', async () => {
    const measurements = new InMemoryMeasurementStore();
    const recognized = new Measurement({
      ...savedMeasurement('msr_1').toJSON(),
      status: 'recognized',
      savedAt: null,
    });
    await measurements.save(recognized);

    const updated = await new OverrideMeasurementUseCase(measurements).execute({
      userId: 'usr_1',
      measurementId: 'msr_1',
      systolic: 121,
      pulse: 69,
      now,
    });

    expect(updated).toMatchObject({
      id: 'msr_1',
      status: 'recognized',
      systolic: 121,
      diastolic: 80,
      pulse: 69,
    });
  });

  it('overrides saved readings after saving', async () => {
    const measurements = new InMemoryMeasurementStore();
    await measurements.save(savedMeasurement('msr_1'));

    const updated = await new OverrideMeasurementUseCase(measurements).execute({
      userId: 'usr_1',
      measurementId: 'msr_1',
      diastolic: 81,
      now,
    });

    expect(updated).toMatchObject({
      id: 'msr_1',
      status: 'saved',
      systolic: 120,
      diastolic: 81,
      pulse: 68,
      savedAt: now.toISOString(),
    });
  });

  it('rejects overriding pending measurements', async () => {
    const measurements = new InMemoryMeasurementStore();
    await measurements.save(
      new Measurement({
        id: 'msr_1',
        userId: 'usr_1',
        status: 'pending',
        systolic: null,
        diastolic: null,
        pulse: null,
        armSide: null,
        measurementTime: now,
        imageId: 'img_1',
        recognitionError: null,
        savedAt: null,
        createdAt: now,
        updatedAt: now,
      }),
    );

    await expect(
      new OverrideMeasurementUseCase(measurements).execute({
        userId: 'usr_1',
        measurementId: 'msr_1',
        systolic: 121,
      }),
    ).rejects.toThrow('Measurement must be recognized before override can be applied');
  });

  it('rejects overriding a missing measurement', async () => {
    await expect(
      new OverrideMeasurementUseCase(new InMemoryMeasurementStore()).execute({
        userId: 'usr_1',
        measurementId: 'missing',
        pulse: 68,
      }),
    ).rejects.toThrow('Measurement was not found');
  });

  it('rejects saving pending measurements and invalid history ranges', async () => {
    const measurements = new InMemoryMeasurementStore();
    await measurements.save(
      new Measurement({
        id: 'msr_1',
        userId: 'usr_1',
        status: 'pending',
        systolic: null,
        diastolic: null,
        pulse: null,
        armSide: null,
        measurementTime: now,
        imageId: 'img_1',
        recognitionError: null,
        savedAt: null,
        createdAt: now,
        updatedAt: now,
      }),
    );

    await expect(new SaveMeasurementUseCase(measurements).execute({ userId: 'usr_1', measurementId: 'msr_1', now })).rejects.toThrow('Measurement must be recognized before it can be saved');
    await expect(
      new ListMeasurementsUseCase(measurements).execute({
        userId: 'usr_1',
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-05-01T00:00:00.000Z',
      }),
    ).rejects.toThrow('from must be before or equal to to');
  });

  it('processes recognition task success and failure paths', async () => {
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
        hand: 'right',
        systolic: 121,
        diastolic: 81,
        pulse: 69,
        confidence: 0.9,
        uncertainFields: [],
        rawNotes: null,
      }),
    };

    await new ProcessRecognitionTaskUseCase(tasks, measurements, images, provider).execute({ taskId, model: 'test-model', now });

    expect([...measurements.measurements.values()][0].status).toBe('recognized');
    expect(tasks.tasks.get(taskId)?.status).toBe('completed');

    await tasks.save(
      new RecognitionTask({
        id: 'missing-task',
        measurementId: 'missing',
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
    const useCase = new ProcessRecognitionTaskUseCase(tasks, measurements, images, provider);
    await useCase.execute({ taskId: 'missing-task', model: 'test-model', now });
    expect(tasks.tasks.get('missing-task')?.status).toBe('queued');
    await useCase.execute({ taskId: 'missing-task', model: 'test-model', now });
    expect(tasks.tasks.get('missing-task')?.status).toBe('failed');
  });
});
