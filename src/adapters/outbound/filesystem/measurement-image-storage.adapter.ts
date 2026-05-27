/* istanbul ignore file */
import { Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  MeasurementImageStorePort,
  StoreMeasurementImageInput,
  StoredMeasurementImageData,
} from '../../../application/ports/measurement-image-store.port';
import { MeasurementImage } from '../../../domain/entities/measurement-image';
import { ApiConfigService } from '../../../infrastructure/config/api-config';
import { PostgresPool } from '../postgres/postgres-pool';

type MeasurementImageRow = {
  id: string;
  measurement_id: string;
  storage_path: string;
  content_type: 'image/jpeg' | 'image/png';
  byte_size: number;
  created_at: Date;
};

@Injectable()
export class FilesystemMeasurementImageStorageAdapter implements MeasurementImageStorePort {
  private readonly directory: string;

  constructor(
    apiConfig: ApiConfigService,
    private readonly pool: PostgresPool,
  ) {
    this.directory = apiConfig.load().measurementImageDirectory;
  }

  async save(input: StoreMeasurementImageInput): Promise<MeasurementImage> {
    await mkdir(this.directory, { recursive: true });
    const extension = input.contentType === 'image/png' ? '.png' : '.jpg';
    const storagePath = path.join(this.directory, `${input.measurementId}-${input.id}${extension}`);
    await writeFile(storagePath, input.data);

    const image = new MeasurementImage({
      id: input.id,
      measurementId: input.measurementId,
      storagePath,
      contentType: input.contentType,
      byteSize: input.data.byteLength,
      createdAt: input.createdAt,
    });
    await this.pool.query(
      `INSERT INTO measurement_images
       (id, measurement_id, storage_path, content_type, byte_size, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (measurement_id) DO UPDATE SET
      id = EXCLUDED.id, storage_path = EXCLUDED.storage_path,
       content_type = EXCLUDED.content_type, byte_size = EXCLUDED.byte_size`,
      [image.id, image.measurementId, image.storagePath, image.contentType, image.byteSize, image.createdAt],
    );

    return image;
  }

  async findByMeasurementId(measurementId: string): Promise<MeasurementImage | null> {
    const result = await this.pool.query<MeasurementImageRow>(
      'SELECT * FROM measurement_images WHERE measurement_id = $1 LIMIT 1',
      [measurementId],
    );

    return result.rows[0] ? toMeasurementImage(result.rows[0]) : null;
  }

  async readByMeasurementId(measurementId: string): Promise<StoredMeasurementImageData | null> {
    const image = await this.findByMeasurementId(measurementId);
    if (!image) {
      return null;
    }

    return { image, data: await readFile(image.storagePath) };
  }

  getImageUrl(measurementId: string): string {
    return `/api/v1/measurements/${measurementId}/image`;
  }
}

function toMeasurementImage(row: MeasurementImageRow): MeasurementImage {
  return new MeasurementImage({
    id: row.id,
    measurementId: row.measurement_id,
    storagePath: row.storage_path,
    contentType: row.content_type,
    byteSize: row.byte_size,
    createdAt: row.created_at,
  });
}
