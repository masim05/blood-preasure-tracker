import { Inject, Injectable } from '@nestjs/common';

import { ApiError } from '../../adapters/inbound/http/http-error.mapper';
import type { Measurement } from '../../domain/entities/measurement';
import type { MeasurementImageStorePort } from '../ports/measurement-image-store.port';
import { MEASUREMENT_IMAGE_STORE } from '../ports/measurement-image-store.port';
import type { MeasurementStorePort } from '../ports/measurement-store.port';
import { MEASUREMENT_STORE } from '../ports/measurement-store.port';

export type GetMeasurementDetailInput = {
  userId: string;
  measurementId: string;
};

export type MeasurementDetailOutput = {
  id: string;
  status: Measurement['status'];
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  armSide?: string;
  measurementTime: string;
  recognitionError?: string;
  imageUrl: string;
  savedAt?: string;
};

@Injectable()
export class GetMeasurementDetailUseCase {
  constructor(
    @Inject(MEASUREMENT_STORE) private readonly measurements: MeasurementStorePort,
    @Inject(MEASUREMENT_IMAGE_STORE) private readonly images: MeasurementImageStorePort,
  ) {}

  async execute(input: GetMeasurementDetailInput): Promise<MeasurementDetailOutput> {
    const measurement = await this.measurements.findByIdForUser(input.measurementId, input.userId);
    if (!measurement) {
      throw new ApiError('not_found', 'Measurement was not found');
    }

    return mapMeasurementDetail(measurement, this.images.getImageUrl(measurement.id));
  }
}

export function mapMeasurementDetail(
  measurement: Measurement,
  imageUrl: string,
): MeasurementDetailOutput {
  const output: MeasurementDetailOutput = {
    id: measurement.id,
    status: measurement.status,
    measurementTime: measurement.measurementTime.toISOString(),
    imageUrl,
  };

  if (measurement.systolic !== null) {
    output.systolic = measurement.systolic;
  }
  if (measurement.diastolic !== null) {
    output.diastolic = measurement.diastolic;
  }
  if (measurement.pulse !== null) {
    output.pulse = measurement.pulse;
  }
  if (measurement.armSide !== null) {
    output.armSide = measurement.armSide;
  }
  if (measurement.recognitionError !== null) {
    output.recognitionError = measurement.recognitionError;
  }
  if (measurement.savedAt !== null) {
    output.savedAt = measurement.savedAt.toISOString();
  }

  return output;
}
