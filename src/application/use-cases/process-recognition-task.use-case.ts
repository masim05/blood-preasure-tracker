import { Inject, Injectable } from '@nestjs/common';

import { ApiError } from '../../adapters/inbound/http/http-error.mapper';
import { RecognitionTask } from '../../domain/entities/recognition-task';
import {
  completeRecognition,
  failRecognition,
  startRecognition,
} from '../../domain/services/measurement-state-policy';
import type { LlmProviderPort } from '../ports/llm-provider.port';
import type { MeasurementImageStorePort } from '../ports/measurement-image-store.port';
import { MEASUREMENT_IMAGE_STORE } from '../ports/measurement-image-store.port';
import type { MeasurementStorePort } from '../ports/measurement-store.port';
import { MEASUREMENT_STORE } from '../ports/measurement-store.port';
import type { RecognitionTaskStorePort } from '../ports/recognition-task-store.port';
import { RECOGNITION_TASK_STORE } from '../ports/recognition-task-store.port';

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export type ProcessRecognitionTaskInput = {
  taskId: string;
  model: string;
  now?: Date;
};

@Injectable()
export class ProcessRecognitionTaskUseCase {
  constructor(
    @Inject(RECOGNITION_TASK_STORE) private readonly recognitionTasks: RecognitionTaskStorePort,
    @Inject(MEASUREMENT_STORE) private readonly measurements: MeasurementStorePort,
    @Inject(MEASUREMENT_IMAGE_STORE) private readonly images: MeasurementImageStorePort,
    @Inject(LLM_PROVIDER) private readonly llmProvider: LlmProviderPort,
  ) {}

  async execute(input: ProcessRecognitionTaskInput): Promise<void> {
    const now = input.now ?? new Date();
    const task = await this.recognitionTasks.findById(input.taskId);
    if (!task) {
      throw new ApiError('not_found', 'Recognition task was not found');
    }

    await this.recognitionTasks.save(
      new RecognitionTask({
        ...task.toJSON(),
        status: 'processing',
        attemptCount: task.attemptCount + 1,
        startedAt: now,
        updatedAt: now,
      }),
    );

    const storedImage = await this.images.readByMeasurementId(task.measurementId);
    const measurement = storedImage ? await this.measurements.findById(task.measurementId) : null;
    if (!storedImage || !measurement) {
      await this.recognitionTasks.save(
        new RecognitionTask({ ...task.toJSON(), status: 'failed', lastError: 'Missing measurement image', completedAt: now, updatedAt: now }),
      );
      return;
    }

    const recognizingMeasurement = startRecognition(measurement, now);
    await this.measurements.save(recognizingMeasurement);
    const response = await this.llmProvider.infer({
      imageId: storedImage.image.id,
      imagePath: storedImage.image.storagePath,
      contentType: storedImage.image.contentType,
      data: storedImage.data,
      model: input.model,
    });

    if (
      response.systolic === null ||
      response.diastolic === null ||
      response.pulse === null ||
      response.hand === null
    ) {
      await this.measurements.save(
        failRecognition(
          recognizingMeasurement,
          'Measurement could not be recognized from this image.',
          now,
        ),
      );
      await this.recognitionTasks.save(
        new RecognitionTask({ ...task.toJSON(), status: 'failed', lastError: 'Incomplete recognition result', completedAt: now, updatedAt: now }),
      );
      return;
    }

    await this.measurements.save(
      completeRecognition(
        recognizingMeasurement,
        {
          systolic: response.systolic,
          diastolic: response.diastolic,
          pulse: response.pulse,
          armSide: response.hand,
        },
        now,
      ),
    );
    await this.recognitionTasks.save(
      new RecognitionTask({ ...task.toJSON(), status: 'completed', completedAt: now, updatedAt: now }),
    );
  }
}

