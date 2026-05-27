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
