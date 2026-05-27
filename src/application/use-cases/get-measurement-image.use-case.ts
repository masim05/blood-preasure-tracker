import { Inject, Injectable } from '@nestjs/common';

import { ApiError } from '../../adapters/inbound/http/http-error.mapper';
import type { MeasurementImage } from '../../domain/entities/measurement-image';
import type { MeasurementImageStorePort } from '../ports/measurement-image-store.port';
import { MEASUREMENT_IMAGE_STORE } from '../ports/measurement-image-store.port';
import type { MeasurementStorePort } from '../ports/measurement-store.port';
import { MEASUREMENT_STORE } from '../ports/measurement-store.port';

export type GetMeasurementImageInput = {
  userId: string;
  measurementId: string;
};

export type GetMeasurementImageOutput = {
  image: MeasurementImage;
  data: Buffer;
};

@Injectable()
export class GetMeasurementImageUseCase {
  constructor(
    @Inject(MEASUREMENT_STORE) private readonly measurements: MeasurementStorePort,
    @Inject(MEASUREMENT_IMAGE_STORE) private readonly images: MeasurementImageStorePort,
  ) {}

  async execute(input: GetMeasurementImageInput): Promise<GetMeasurementImageOutput> {
    const measurement = await this.measurements.findByIdForUser(input.measurementId, input.userId);
    if (!measurement) {
      throw new ApiError('not_found', 'Measurement was not found');
    }

    const storedImage = await this.images.readByMeasurementId(input.measurementId);
    if (!storedImage) {
      throw new ApiError('not_found', 'Measurement image was not found');
    }

    return storedImage;
  }
}
