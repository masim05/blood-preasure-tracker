import { Inject, Injectable } from '@nestjs/common';

import { ApiError } from '../../adapters/inbound/http/http-error.mapper';
import { Measurement } from '../../domain/entities/measurement';
import type { MeasurementStorePort } from '../ports/measurement-store.port';
import { MEASUREMENT_STORE } from '../ports/measurement-store.port';
import { mapMeasurementDetail, type MeasurementDetailOutput } from './get-measurement-detail.use-case';

export type OverrideMeasurementInput = {
  userId: string;
  measurementId: string;
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  now?: Date;
};

@Injectable()
export class OverrideMeasurementUseCase {
  constructor(@Inject(MEASUREMENT_STORE) private readonly measurements: MeasurementStorePort) {}

  async execute(input: OverrideMeasurementInput): Promise<Omit<MeasurementDetailOutput, 'imageUrl'>> {
    const measurement = await this.measurements.findByIdForUser(input.measurementId, input.userId);
    if (!measurement) {
      throw new ApiError('not_found', 'Measurement was not found');
    }

    if (measurement.status !== 'recognized' && measurement.status !== 'saved') {
      throw new ApiError('conflict', 'Measurement must be recognized before override can be applied');
    }

    const updated = new Measurement({
      ...measurement.toJSON(),
      systolic: input.systolic ?? measurement.systolic,
      diastolic: input.diastolic ?? measurement.diastolic,
      pulse: input.pulse ?? measurement.pulse,
      updatedAt: input.now ?? new Date(),
    });
    await this.measurements.save(updated);
    const { imageUrl, ...response } = mapMeasurementDetail(updated, '');
    return response;
  }
}
