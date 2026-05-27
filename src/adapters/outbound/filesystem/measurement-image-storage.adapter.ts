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

@Injectable()
export class FilesystemMeasurementImageStorageAdapter implements MeasurementImageStorePort {
  private readonly directory: string;
  private readonly images = new Map<string, MeasurementImage>();

  constructor(apiConfig: ApiConfigService) {
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
    this.images.set(input.measurementId, image);

    return image;
  }

  async findByMeasurementId(measurementId: string): Promise<MeasurementImage | null> {
    return this.images.get(measurementId) ?? null;
  }

  async readByMeasurementId(measurementId: string): Promise<StoredMeasurementImageData | null> {
    const image = this.images.get(measurementId);
    if (!image) {
      return null;
    }

    return { image, data: await readFile(image.storagePath) };
  }

  getImageUrl(measurementId: string): string {
    return `/api/v1/measurements/${measurementId}/image`;
  }
}
