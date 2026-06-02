export type MeasurementUploadFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
};

export type MeasurementQueryDto = {
  page?: string;
  pageSize?: string;
  from?: string;
  to?: string;
};

export type MeasurementOverrideDto = {
  systolic?: number;
  diastolic?: number;
  pulse?: number;
};

export type SaveMeasurementDto = {
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  armSide?: ArmSide;
};

export function parseOptionalPositiveInteger(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error('query value must be an integer');
  }

  return parsed;
}

export function parseMeasurementOverride(
  input: MeasurementOverrideDto | undefined,
): MeasurementOverrideDto {
  const payload = input ?? {};
  rejectUnexpectedOverrideFields(payload);
  const output: MeasurementOverrideDto = {
    systolic: parseOptionalBodyInteger(payload.systolic, 'systolic'),
    diastolic: parseOptionalBodyInteger(payload.diastolic, 'diastolic'),
    pulse: parseOptionalBodyInteger(payload.pulse, 'pulse'),
  };

  if (output.systolic === undefined && output.diastolic === undefined && output.pulse === undefined) {
    throw new Error('at least one of systolic, diastolic, pulse is required');
  }

  return output;
}

export function parseSaveMeasurement(
  input: SaveMeasurementDto | undefined,
): SaveMeasurementDto {
  const payload = input ?? {};
  rejectUnexpectedSaveFields(payload);

  return {
    systolic: parseOptionalBodyInteger(payload.systolic, 'systolic'),
    diastolic: parseOptionalBodyInteger(payload.diastolic, 'diastolic'),
    pulse: parseOptionalBodyInteger(payload.pulse, 'pulse'),
    armSide: parseOptionalArmSide(payload.armSide),
  };
}

function rejectUnexpectedOverrideFields(payload: MeasurementOverrideDto): void {
  const allowedFields = new Set(['systolic', 'diastolic', 'pulse']);
  for (const field of Object.keys(payload)) {
    if (!allowedFields.has(field)) {
      throw new Error(`unexpected field: ${field}`);
    }
  }
}

function rejectUnexpectedSaveFields(payload: SaveMeasurementDto): void {
  const allowedFields = new Set(['systolic', 'diastolic', 'pulse', 'armSide']);
  for (const field of Object.keys(payload)) {
    if (!allowedFields.has(field)) {
      throw new Error(`unexpected field: ${field}`);
    }
  }
}

function parseOptionalBodyInteger(value: number | undefined, field: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer`);
  }

  return value;
}

function parseOptionalArmSide(value: string | undefined): ArmSide | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value !== 'left' && value !== 'right' && value !== 'unknown') {
    throw new Error('armSide must be one of left, right, unknown');
  }

  return value;
}
import type { ArmSide } from '../../../../domain/entities/measurement';
