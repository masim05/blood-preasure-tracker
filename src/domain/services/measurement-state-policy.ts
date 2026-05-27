import { Measurement, type ArmSide, type MeasurementStatus } from '../entities/measurement';

export type RecognizedValues = {
  systolic: number;
  diastolic: number;
  pulse: number;
  armSide: ArmSide;
};

export function assertTransitionAllowed(from: MeasurementStatus, to: MeasurementStatus): void {
  const allowed: Record<MeasurementStatus, MeasurementStatus[]> = {
    pending: ['recognizing'],
    recognizing: ['recognized', 'failed'],
    recognized: ['saved'],
    saved: [],
    failed: [],
  };

  if (!allowed[from].includes(to)) {
    throw new Error(`measurement cannot transition from ${from} to ${to}`);
  }
}

export function startRecognition(measurement: Measurement, now: Date): Measurement {
  assertTransitionAllowed(measurement.status, 'recognizing');

  return new Measurement({ ...measurement.toJSON(), status: 'recognizing', updatedAt: now });
}

export function completeRecognition(
  measurement: Measurement,
  values: RecognizedValues,
  now: Date,
): Measurement {
  assertTransitionAllowed(measurement.status, 'recognized');

  return new Measurement({
    ...measurement.toJSON(),
    status: 'recognized',
    systolic: values.systolic,
    diastolic: values.diastolic,
    pulse: values.pulse,
    armSide: values.armSide,
    recognitionError: null,
    updatedAt: now,
  });
}

export function failRecognition(
  measurement: Measurement,
  recognitionError: string,
  now: Date,
): Measurement {
  assertTransitionAllowed(measurement.status, 'failed');

  return new Measurement({
    ...measurement.toJSON(),
    status: 'failed',
    recognitionError,
    updatedAt: now,
  });
}

export function saveRecognizedMeasurement(measurement: Measurement, now: Date): Measurement {
  assertTransitionAllowed(measurement.status, 'saved');

  return new Measurement({ ...measurement.toJSON(), status: 'saved', savedAt: now, updatedAt: now });
}
