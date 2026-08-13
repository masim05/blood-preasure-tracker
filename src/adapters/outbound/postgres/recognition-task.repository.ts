import { Injectable } from '@nestjs/common';

import type { RecognitionTaskStorePort } from '../../../application/ports/recognition-task-store.port';
import type { Measurement } from '../../../domain/entities/measurement';
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
  /* istanbul ignore next */
  constructor(private readonly pool: PostgresPool) {}

  async findById(id: string): Promise<RecognitionTask | null> {
    const result = await this.pool.query<RecognitionTaskRow>(
      'SELECT * FROM recognition_tasks WHERE id = $1 LIMIT 1',
      [id],
    );

    return result.rows[0] ? toRecognitionTask(result.rows[0]) : null;
  }

  async recoverAbandoned(
    cutoff: Date,
    now: Date,
    maxAttempts: number,
    lastError: string,
    recognitionError: string,
  ): Promise<void> {
    await this.pool.query(
      `WITH recovered AS (
         UPDATE recognition_tasks
         SET status = CASE WHEN attempt_count >= $3 THEN 'failed' ELSE 'queued' END,
             last_error = $4,
             available_at = CASE WHEN attempt_count >= $3 THEN available_at ELSE $2 END,
             started_at = NULL,
             completed_at = CASE WHEN attempt_count >= $3 THEN $2 ELSE NULL END,
             updated_at = $2
         WHERE status = 'processing' AND started_at <= $1
         RETURNING measurement_id, status
       )
       UPDATE measurements AS measurement
       SET status = 'failed', recognition_error = $5, updated_at = $2
       FROM recovered
       WHERE recovered.status = 'failed'
         AND measurement.id = recovered.measurement_id
         AND measurement.status = 'recognizing'`,
      [cutoff, now, maxAttempts, lastError, recognitionError],
    );
  }

  async claimQueued(
    now: Date,
    batchSize: number,
    maxAttempts: number,
  ): Promise<RecognitionTask[]> {
    const result = await this.pool.query<RecognitionTaskRow>(
      `WITH claimable AS (
         SELECT id
         FROM recognition_tasks
         WHERE status = 'queued' AND available_at <= $1 AND attempt_count < $3
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
      [now, batchSize, maxAttempts],
    );

    return result.rows.map(toRecognitionTask);
  }

  async scheduleRetry(
    task: RecognitionTask,
    availableAt: Date,
    lastError: string,
    now: Date,
  ): Promise<boolean> {
    const result = await this.pool.query<{ id: string }>(
      `UPDATE recognition_tasks
       SET status = 'queued',
           last_error = $2,
           available_at = $3,
           started_at = NULL,
           updated_at = $4
       WHERE id = $1 AND status = 'processing' AND attempt_count = $5 AND started_at = $6
       RETURNING id`,
      [task.id, lastError, availableAt, now, task.attemptCount, task.startedAt],
    );
    return result.rows.length === 1;
  }

  async completeAttempt(
    task: RecognitionTask,
    measurement: Measurement,
    now: Date,
  ): Promise<boolean> {
    const result = await this.pool.query<{ id: string }>(
      `WITH completed AS (
         UPDATE recognition_tasks
         SET status = 'completed', completed_at = $4, updated_at = $4
         WHERE id = $1 AND status = 'processing' AND attempt_count = $2 AND started_at = $3
         RETURNING measurement_id
       ), persisted AS (
         UPDATE measurements AS measurement
         SET status = 'recognized', systolic = $5, diastolic = $6, pulse = $7,
             arm_side = $8, recognition_error = NULL, updated_at = $4
         FROM completed
         WHERE measurement.id = completed.measurement_id AND measurement.status = 'recognizing'
         RETURNING measurement.id
       )
       SELECT id FROM persisted`,
      [
        task.id,
        task.attemptCount,
        task.startedAt,
        now,
        measurement.systolic,
        measurement.diastolic,
        measurement.pulse,
        measurement.armSide,
      ],
    );
    return result.rows.length === 1;
  }

  async failAttempt(
    task: RecognitionTask,
    lastError: string,
    now: Date,
    recognitionError: string | null,
  ): Promise<boolean> {
    const result = await this.pool.query<{ id: string }>(
      `WITH failed AS (
         UPDATE recognition_tasks
         SET status = 'failed', last_error = $4, completed_at = $5, updated_at = $5
         WHERE id = $1 AND status = 'processing' AND attempt_count = $2 AND started_at = $3
         RETURNING id, measurement_id
       ), persisted AS (
         UPDATE measurements AS stored
         SET status = 'failed', recognition_error = $6, updated_at = $5
         FROM failed
         WHERE stored.id = failed.measurement_id AND stored.status = 'recognizing' AND $6::text IS NOT NULL
       )
       SELECT id FROM failed`,
      [
        task.id,
        task.attemptCount,
        task.startedAt,
        lastError,
        now,
        recognitionError,
      ],
    );
    return result.rows.length === 1;
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
