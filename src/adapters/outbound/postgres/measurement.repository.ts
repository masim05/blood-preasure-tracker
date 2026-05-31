/* istanbul ignore file */
import { Injectable } from '@nestjs/common';

import type {
  ListMeasurementsFilter,
  MeasurementHistoryPage,
  MeasurementStorePort,
} from '../../../application/ports/measurement-store.port';
import { Measurement } from '../../../domain/entities/measurement';
import { PostgresPool } from './postgres-pool';

type MeasurementRow = {
  id: string;
  user_id: string;
  status: 'pending' | 'recognizing' | 'recognized' | 'saved' | 'failed';
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  arm_side: 'left' | 'right' | 'unknown' | null;
  measurement_time: Date;
  image_id: string | null;
  recognition_error: string | null;
  saved_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class PostgresMeasurementRepository implements MeasurementStorePort {
  constructor(private readonly pool: PostgresPool) {}

  async findById(id: string): Promise<Measurement | null> {
    const result = await this.pool.query<MeasurementRow>(
      'SELECT * FROM measurements WHERE id = $1 LIMIT 1',
      [id],
    );

    return result.rows[0] ? toMeasurement(result.rows[0]) : null;
  }

  async findByIdForUser(id: string, userId: string): Promise<Measurement | null> {
    const result = await this.pool.query<MeasurementRow>(
      'SELECT * FROM measurements WHERE id = $1 AND user_id = $2 LIMIT 1',
      [id, userId],
    );

    return result.rows[0] ? toMeasurement(result.rows[0]) : null;
  }

  async save(measurement: Measurement): Promise<void> {
    await this.pool.query(
      `INSERT INTO measurements
       (id, user_id, status, systolic, diastolic, pulse, arm_side, measurement_time, image_id, recognition_error, saved_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE SET
       status = EXCLUDED.status, systolic = EXCLUDED.systolic, diastolic = EXCLUDED.diastolic,
       pulse = EXCLUDED.pulse, arm_side = EXCLUDED.arm_side, image_id = EXCLUDED.image_id,
       recognition_error = EXCLUDED.recognition_error, saved_at = EXCLUDED.saved_at, updated_at = EXCLUDED.updated_at`,
      [
        measurement.id,
        measurement.userId,
        measurement.status,
        measurement.systolic,
        measurement.diastolic,
        measurement.pulse,
        measurement.armSide,
        measurement.measurementTime,
        measurement.imageId,
        measurement.recognitionError,
        measurement.savedAt,
        measurement.createdAt,
        measurement.updatedAt,
      ],
    );
  }

  async listSavedForUser(filter: ListMeasurementsFilter): Promise<MeasurementHistoryPage> {
    const offset = (filter.page - 1) * filter.pageSize;
    const result = await this.pool.query<MeasurementRow>(
      `SELECT * FROM measurements
       WHERE user_id = $1 AND status IN ('recognized', 'saved')
       AND ($2::timestamptz IS NULL OR measurement_time >= $2)
       AND ($3::timestamptz IS NULL OR measurement_time <= $3)
       ORDER BY measurement_time DESC, id DESC
       LIMIT $4 OFFSET $5`,
      [filter.userId, filter.from, filter.to, filter.pageSize + 1, offset],
    );
    const rows = result.rows.slice(0, filter.pageSize);

    return {
      items: rows.map(toMeasurement),
      page: filter.page,
      pageSize: filter.pageSize,
      hasNextPage: result.rows.length > filter.pageSize,
      from: filter.from,
      to: filter.to,
    };
  }
}

function toMeasurement(row: MeasurementRow): Measurement {
  return new Measurement({
    id: row.id,
    userId: row.user_id,
    status: row.status,
    systolic: row.systolic,
    diastolic: row.diastolic,
    pulse: row.pulse,
    armSide: row.arm_side,
    measurementTime: row.measurement_time,
    imageId: row.image_id,
    recognitionError: row.recognition_error,
    savedAt: row.saved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}
