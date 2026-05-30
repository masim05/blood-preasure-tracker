/* istanbul ignore file */
import { Injectable } from '@nestjs/common';

import type { RecognitionTaskStorePort } from '../../../application/ports/recognition-task-store.port';
import { RecognitionTask } from '../../../domain/entities/recognition-task';
import { PostgresPool } from './postgres-pool';

type RecognitionTaskRow = {
  id: string;
  measurement_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  attempt_count: number;
  last_error: string | null;
  available_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class PostgresRecognitionTaskRepository implements RecognitionTaskStorePort {
  constructor(private readonly pool: PostgresPool) {}

  async findById(id: string): Promise<RecognitionTask | null> {
    const result = await this.pool.query<RecognitionTaskRow>(
      'SELECT * FROM recognition_tasks WHERE id = $1 LIMIT 1',
      [id],
    );

    return result.rows[0] ? toRecognitionTask(result.rows[0]) : null;
  }

  async claimQueued(now: Date, batchSize: number): Promise<RecognitionTask[]> {
    const result = await this.pool.query<RecognitionTaskRow>(
      `WITH claimable AS (
         SELECT id
         FROM recognition_tasks
         WHERE status = 'queued' AND available_at <= $1
         ORDER BY available_at ASC, created_at ASC
         FOR UPDATE SKIP LOCKED
         LIMIT $2
       )
       UPDATE recognition_tasks AS task
       SET status = 'processing',
           attempt_count = task.attempt_count + 1,
           started_at = $1,
           updated_at = $1
       FROM claimable
       WHERE task.id = claimable.id
       RETURNING task.*`,
      [now, batchSize],
    );

    return result.rows.map(toRecognitionTask);
  }

  async scheduleRetry(taskId: string, availableAt: Date, lastError: string, now: Date): Promise<void> {
    await this.pool.query(
      `UPDATE recognition_tasks
       SET status = 'queued',
           last_error = $2,
           available_at = $3,
           started_at = NULL,
           updated_at = $4
       WHERE id = $1`,
      [taskId, lastError, availableAt, now],
    );
  }

  async save(task: RecognitionTask): Promise<void> {
    await this.pool.query(
      `INSERT INTO recognition_tasks
       (id, measurement_id, status, attempt_count, last_error, available_at, started_at, completed_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, attempt_count = EXCLUDED.attempt_count,
       last_error = EXCLUDED.last_error, started_at = EXCLUDED.started_at, completed_at = EXCLUDED.completed_at,
       updated_at = EXCLUDED.updated_at`,
      [
        task.id,
        task.measurementId,
        task.status,
        task.attemptCount,
        task.lastError,
        task.availableAt,
        task.startedAt,
        task.completedAt,
        task.createdAt,
        task.updatedAt,
      ],
    );
  }
}

function toRecognitionTask(row: RecognitionTaskRow): RecognitionTask {
  return new RecognitionTask({
    id: row.id,
    measurementId: row.measurement_id,
    status: row.status,
    attemptCount: row.attempt_count,
    lastError: row.last_error,
    availableAt: row.available_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}
