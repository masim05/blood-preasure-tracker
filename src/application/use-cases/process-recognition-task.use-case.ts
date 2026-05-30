import { Inject, Injectable } from '@nestjs/common';

import { ApiError } from '../../adapters/inbound/http/http-error.mapper';
import { RecognitionTask } from '../../domain/entities/recognition-task';
import {
  completeRecognition,
  failRecognition,
  startRecognition,
} from '../../domain/services/measurement-state-policy';
import type { Measurement } from '../../domain/entities/measurement';
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

    if (task.status === 'completed' || task.status === 'failed') {
      return;
    }

    const activeTask =
      task.status === 'queued'
        ? new RecognitionTask({
            ...task.toJSON(),
            status: 'processing',
            attemptCount: task.attemptCount + 1,
            startedAt: now,
            updatedAt: now,
          })
        : task;

    if (task.status === 'queued') {
      await this.recognitionTasks.save(activeTask);
    }

    const storedImage = await this.images.readByMeasurementId(activeTask.measurementId);
    const measurement = storedImage ? await this.measurements.findById(activeTask.measurementId) : null;
    if (!storedImage || !measurement) {
      await this.handleFailure(activeTask, 'Missing measurement image', now);
      return;
    }

    const recognizingMeasurement =
      measurement.status === 'pending' ? startRecognition(measurement, now) : measurement;
    if (measurement.status === 'pending') {
      await this.measurements.save(recognizingMeasurement);
    }

    let response: Awaited<ReturnType<LlmProviderPort['infer']>>;
    try {
      response = await this.llmProvider.infer({
        imageId: storedImage.image.id,
        imagePath: storedImage.image.storagePath,
        contentType: storedImage.image.contentType,
        data: storedImage.data,
        model: input.model,
      });
    } catch (error) {
      await this.handleFailure(
        activeTask,
        error instanceof Error ? error.message : 'Recognition provider failure',
        now,
        recognizingMeasurement,
      );
      return;
    }

    if (
      response.systolic === null ||
      response.diastolic === null ||
      response.pulse === null ||
      response.hand === null
    ) {
      await this.handleFailure(
        activeTask,
        'Incomplete recognition result',
        now,
        recognizingMeasurement,
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
      new RecognitionTask({ ...activeTask.toJSON(), status: 'completed', completedAt: now, updatedAt: now }),
    );
  }

  private async handleFailure(
    task: RecognitionTask,
    errorMessage: string,
    now: Date,
    measurement: Measurement | null = null,
  ): Promise<void> {
    if (task.attemptCount < 2) {
      await this.recognitionTasks.scheduleRetry(task.id, now, errorMessage, now);
      return;
    }

    if (measurement && measurement.status === 'recognizing') {
      await this.measurements.save(
        failRecognition(measurement, 'Measurement could not be recognized from this image.', now),
      );
    }

    await this.recognitionTasks.save(
      new RecognitionTask({
        ...task.toJSON(),
        status: 'failed',
        lastError: errorMessage,
        completedAt: now,
        updatedAt: now,
      }),
    );
  }
}

