import { Inject, Injectable } from '@nestjs/common';

import { ApiError } from '../../adapters/inbound/http/http-error.mapper';
import { Measurement, type ArmSide } from '../../domain/entities/measurement';
import { saveRecognizedMeasurement } from '../../domain/services/measurement-state-policy';
import type { MeasurementStorePort } from '../ports/measurement-store.port';
import { MEASUREMENT_STORE } from '../ports/measurement-store.port';
import { mapMeasurementDetail, type MeasurementDetailOutput } from './get-measurement-detail.use-case';

export type SaveMeasurementInput = {
  userId: string;
  measurementId: string;
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  armSide?: ArmSide;
  now?: Date;
};

@Injectable()
export class SaveMeasurementUseCase {
  constructor(@Inject(MEASUREMENT_STORE) private readonly measurements: MeasurementStorePort) {}

  async execute(input: SaveMeasurementInput): Promise<Omit<MeasurementDetailOutput, 'imageUrl'>> {
    const measurement = await this.measurements.findByIdForUser(input.measurementId, input.userId);
    if (!measurement) {
      throw new ApiError('not_found', 'Measurement was not found');
    }

    try {
      const updatedForSave = new Measurement({
        ...measurement.toJSON(),
        systolic: input.systolic ?? measurement.systolic,
        diastolic: input.diastolic ?? measurement.diastolic,
        pulse: input.pulse ?? measurement.pulse,
        armSide: input.armSide ?? measurement.armSide,
        updatedAt: input.now ?? new Date(),
      });
      const saved = saveRecognizedMeasurement(updatedForSave, input.now ?? new Date());
      await this.measurements.save(saved);
      const { imageUrl, ...response } = mapMeasurementDetail(saved, '');
      return response;
    } catch {
      throw new ApiError('conflict', 'Measurement must be recognized before it can be saved');
    }
  }
}
