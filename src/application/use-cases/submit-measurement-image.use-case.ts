import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { ApiError } from '../../adapters/inbound/http/http-error.mapper';
import { Measurement } from '../../domain/entities/measurement';
import { RecognitionTask } from '../../domain/entities/recognition-task';
import { validateUploadImage } from '../../domain/services/upload-image-policy';
import type { MeasurementImageStorePort } from '../ports/measurement-image-store.port';
import { MEASUREMENT_IMAGE_STORE } from '../ports/measurement-image-store.port';
import type { MeasurementStorePort } from '../ports/measurement-store.port';
import { MEASUREMENT_STORE } from '../ports/measurement-store.port';
import type { RecognitionTaskStorePort } from '../ports/recognition-task-store.port';
import { RECOGNITION_TASK_STORE } from '../ports/recognition-task-store.port';

export type SubmitMeasurementImageInput = {
  userId: string;
  contentType: string;
  originalName: string;
  data: Buffer;
  now?: Date;
};

export type SubmitMeasurementImageOutput = {
  id: string;
  status: 'pending';
  measurementTime: string;
};

@Injectable()
export class SubmitMeasurementImageUseCase {
  constructor(
    @Inject(MEASUREMENT_STORE) private readonly measurements: MeasurementStorePort,
    @Inject(MEASUREMENT_IMAGE_STORE) private readonly images: MeasurementImageStorePort,
    @Inject(RECOGNITION_TASK_STORE) private readonly recognitionTasks: RecognitionTaskStorePort,
  ) {}

  async execute(input: SubmitMeasurementImageInput): Promise<SubmitMeasurementImageOutput> {
    const contentType = validateUpload(input.contentType, input.data.byteLength);
    const now = input.now ?? new Date();
    const measurementId = `msr_${randomUUID()}`;
    const imageId = `img_${randomUUID()}`;

    const image = await this.images.save({
      id: imageId,
      measurementId,
      contentType,
      data: input.data,
      originalName: input.originalName,
      createdAt: now,
    });
    const measurement = new Measurement({
      id: measurementId,
      userId: input.userId,
      status: 'pending',
      systolic: null,
      diastolic: null,
      pulse: null,
      armSide: null,
      measurementTime: now,
      imageId: image.id,
      recognitionError: null,
      savedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    await this.measurements.save(measurement);
    await this.recognitionTasks.save(
      new RecognitionTask({
        id: `rct_${randomUUID()}`,
        measurementId,
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

    return { id: measurement.id, status: 'pending', measurementTime: now.toISOString() };
  }
}

function validateUpload(contentType: string, byteSize: number): 'image/jpeg' | 'image/png' {
  try {
    return validateUploadImage({ contentType, byteSize });
  } catch (error) {
    throw new ApiError(
      'validation_error',
      error instanceof Error ? error.message : 'Uploaded image is invalid',
    );
  }
}
