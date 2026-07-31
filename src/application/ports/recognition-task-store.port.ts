import type { RecognitionTask } from '../../domain/entities/recognition-task';
import type { Measurement } from '../../domain/entities/measurement';

export const RECOGNITION_TASK_STORE = Symbol('RECOGNITION_TASK_STORE');

export interface RecognitionTaskStorePort {
  findById(id: string): Promise<RecognitionTask | null>;
  recoverAbandoned(
    cutoff: Date,
    now: Date,
    maxAttempts: number,
    lastError: string,
    recognitionError: string,
  ): Promise<void>;
  claimQueued(
    now: Date,
    batchSize: number,
    maxAttempts: number,
  ): Promise<RecognitionTask[]>;
  scheduleRetry(
    task: RecognitionTask,
    availableAt: Date,
    lastError: string,
    now: Date,
  ): Promise<boolean>;
  completeAttempt(
    task: RecognitionTask,
    measurement: Measurement,
    now: Date,
  ): Promise<boolean>;
  failAttempt(
    task: RecognitionTask,
    lastError: string,
    now: Date,
    recognitionError: string | null,
  ): Promise<boolean>;
  save(task: RecognitionTask): Promise<void>;
}
