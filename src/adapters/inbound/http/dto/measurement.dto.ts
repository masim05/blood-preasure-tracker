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

function parseOptionalBodyInteger(value: number | undefined, field: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer`);
  }

  return value;
}
