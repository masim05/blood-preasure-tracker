import type { RecognitionTask } from '../../domain/entities/recognition-task';

export const RECOGNITION_TASK_STORE = Symbol('RECOGNITION_TASK_STORE');

export interface RecognitionTaskStorePort {
  findById(id: string): Promise<RecognitionTask | null>;
  save(task: RecognitionTask): Promise<void>;
}
