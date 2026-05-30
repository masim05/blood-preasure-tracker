import type { RecognitionTask } from '../../domain/entities/recognition-task';

export const RECOGNITION_TASK_STORE = Symbol('RECOGNITION_TASK_STORE');

export interface RecognitionTaskStorePort {
  findById(id: string): Promise<RecognitionTask | null>;
  claimQueued(now: Date, batchSize: number): Promise<RecognitionTask[]>;
  scheduleRetry(taskId: string, availableAt: Date, lastError: string, now: Date): Promise<void>;
  save(task: RecognitionTask): Promise<void>;
}
