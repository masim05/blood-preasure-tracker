import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { FilesystemMeasurementImageStorageAdapter } from '../../../src/adapters/outbound/filesystem/measurement-image-storage.adapter';
import type { PostgresPool } from '../../../src/adapters/outbound/postgres/postgres-pool';
import type { ApiConfigService } from '../../../src/infrastructure/config/api-config';
import { pngBytes } from '../../helpers/image-bytes';

type MeasurementImageRow = {
  id: string;
  measurement_id: string;
  storage_path: string;
  content_type: 'image/jpeg' | 'image/png';
  byte_size: number;
  created_at: Date;
};

class FakePostgresPool {
  readonly rows = new Map<string, MeasurementImageRow>();

  async query<T>(text: string, values: unknown[] = []): Promise<{ rows: T[] }> {
    if (text.includes('INSERT INTO measurement_images')) {
      const [id, measurementId, storagePath, contentType, byteSize, createdAt] = values as [string, string, string, 'image/jpeg' | 'image/png', number, Date];
      this.rows.set(measurementId, {
        id,
        measurement_id: measurementId,
        storage_path: storagePath,
        content_type: contentType,
        byte_size: byteSize,
        created_at: createdAt,
      });

      return { rows: [] };
    }

    if (text.includes('SELECT * FROM measurement_images')) {
      const [measurementId] = values as [string];
      const row = this.rows.get(measurementId);

      return { rows: (row ? [row] : []) as T[] };
    }

    throw new Error(`unexpected query: ${text}`);
  }
}

describe('FilesystemMeasurementImageStorageAdapter', () => {
  it('persists image metadata in Postgres and reads it after adapter re-instantiation', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'bp-images-'));
    const pool = new FakePostgresPool();
    const apiConfig = { load: () => ({ measurementImageDirectory: directory }) } as ApiConfigService;
    const firstAdapter = new FilesystemMeasurementImageStorageAdapter(apiConfig, pool as unknown as PostgresPool);

    await firstAdapter.save({
      id: 'img_1',
      measurementId: 'msr_1',
      contentType: 'image/png',
      data: pngBytes,
      originalName: 'bp.png',
      createdAt: new Date('2026-05-27T12:00:00.000Z'),
    });

    const secondAdapter = new FilesystemMeasurementImageStorageAdapter(apiConfig, pool as unknown as PostgresPool);
    await expect(secondAdapter.findByMeasurementId('msr_1')).resolves.toMatchObject({
      id: 'img_1',
      measurementId: 'msr_1',
      contentType: 'image/png',
      byteSize: pngBytes.byteLength,
    });
    await expect(secondAdapter.readByMeasurementId('msr_1')).resolves.toMatchObject({
      data: pngBytes,
      image: expect.objectContaining({ id: 'img_1' }),
    });
  });
});
