import { BearerAuthGuard } from '../../adapters/inbound/http/bearer-auth.guard';
import { ApiError } from '../../adapters/inbound/http/http-error.mapper';
import { GetMeasurementDetailUseCase } from './get-measurement-detail.use-case';
import { GetMeasurementImageUseCase } from './get-measurement-image.use-case';
import { ListMeasurementsUseCase } from './list-measurements.use-case';
import { ProcessRecognitionTaskUseCase } from './process-recognition-task.use-case';
import { SaveMeasurementUseCase } from './save-measurement.use-case';
import type { LlmProviderPort } from '../ports/llm-provider.port';
import type { MeasurementHistoryPage, MeasurementStorePort } from '../ports/measurement-store.port';
import { Measurement } from '../../domain/entities/measurement';
import {
  InMemoryMeasurementImageStore,
  InMemoryMeasurementStore,
  InMemoryRecognitionTaskStore,
} from '../../test-support/mobile-api-fakes';

const now = new Date('2026-05-27T12:00:00.000Z');
const provider: LlmProviderPort = {
  provider: 'test',
  infer: jest.fn(),
};

describe('mobile API not-found and malformed-state branches', () => {
  it('rejects guard requests without bearer token', async () => {
    const guard = new BearerAuthGuard({ execute: jest.fn() });

    await expect(
      guard.canActivate({ switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }) } as ExecutionContextStub),
    ).rejects.toThrow('Bearer token is required');
  });

  it('returns not found for missing detail, image, save, and recognition task', async () => {
    const measurements = new InMemoryMeasurementStore();
    const images = new InMemoryMeasurementImageStore();
    const tasks = new InMemoryRecognitionTaskStore();

    await expect(new GetMeasurementDetailUseCase(measurements, images).execute({ userId: 'usr_1', measurementId: 'missing' })).rejects.toThrow('Measurement was not found');
    await expect(new GetMeasurementImageUseCase(measurements, images).execute({ userId: 'usr_1', measurementId: 'missing' })).rejects.toThrow('Measurement was not found');
    await expect(new SaveMeasurementUseCase(measurements).execute({ userId: 'usr_1', measurementId: 'missing', now })).rejects.toThrow('Measurement was not found');
    await expect(new ProcessRecognitionTaskUseCase(tasks, measurements, images, provider).execute({ taskId: 'missing', model: 'model', now })).rejects.toThrow('Recognition task was not found');
  });

  it('returns not found when a measurement image record is missing for an owned measurement', async () => {
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

    await expect(new GetMeasurementImageUseCase(measurements, new InMemoryMeasurementImageStore()).execute({ userId: 'usr_1', measurementId: 'msr_1' })).rejects.toThrow('Measurement image was not found');
  });

  it('rejects malformed saved records returned by persistence', async () => {
    const malformed = new Measurement({
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
    });
    const store: MeasurementStorePort = {
      findById: jest.fn(),
      findByIdForUser: jest.fn(),
      save: jest.fn(),
      listSavedForUser: jest.fn<Promise<MeasurementHistoryPage>, []>().mockResolvedValue({
        items: [malformed],
        page: 1,
        pageSize: 20,
        hasNextPage: false,
        from: null,
        to: null,
      }),
    };

    await expect(new ListMeasurementsUseCase(store).execute({ userId: 'usr_1' })).rejects.toThrow(ApiError);
  });
});

type ExecutionContextStub = {
  switchToHttp(): { getRequest(): { headers: Record<string, string | undefined> } };
};
