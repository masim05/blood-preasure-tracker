import { Inject, Injectable } from '@nestjs/common';

import { ApiError } from '../../adapters/inbound/http/http-error.mapper';
import { validatePagination } from '../../domain/services/pagination-policy';
import type { MeasurementStorePort } from '../ports/measurement-store.port';
import { MEASUREMENT_STORE } from '../ports/measurement-store.port';

export type ListMeasurementsInput = {
  userId: string;
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
};

export type ListMeasurementsOutput = {
  items: Array<{
    id: string;
    status: 'saved';
    systolic: number;
    diastolic: number;
    pulse: number;
    armSide: string;
    measurementTime: string;
    savedAt: string;
  }>;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  filters: { from: string | null; to: string | null };
};

@Injectable()
export class ListMeasurementsUseCase {
  constructor(@Inject(MEASUREMENT_STORE) private readonly measurements: MeasurementStorePort) {}

  async execute(input: ListMeasurementsInput): Promise<ListMeasurementsOutput> {
    const pagination = parsePagination(input);
    const page = await this.measurements.listSavedForUser({ userId: input.userId, ...pagination });

    return {
      items: page.items.map((measurement) => {
        if (
          measurement.status !== 'saved' ||
          measurement.systolic === null ||
          measurement.diastolic === null ||
          measurement.pulse === null ||
          measurement.armSide === null ||
          measurement.savedAt === null
        ) {
          throw new ApiError('validation_error', 'History can include saved measurements only');
        }

        return {
          id: measurement.id,
          status: 'saved',
          systolic: measurement.systolic,
          diastolic: measurement.diastolic,
          pulse: measurement.pulse,
          armSide: measurement.armSide,
          measurementTime: measurement.measurementTime.toISOString(),
          savedAt: measurement.savedAt.toISOString(),
        };
      }),
      page: page.page,
      pageSize: page.pageSize,
      hasNextPage: page.hasNextPage,
      filters: {
        from: page.from ? page.from.toISOString() : null,
        to: page.to ? page.to.toISOString() : null,
      },
    };
  }
}

function parsePagination(input: ListMeasurementsInput): ReturnType<typeof validatePagination> {
  try {
    return validatePagination({
      page: input.page,
      pageSize: input.pageSize,
      from: input.from ? new Date(input.from) : null,
      to: input.to ? new Date(input.to) : null,
    });
  } catch (error) {
    throw new ApiError(
      'validation_error',
      error instanceof Error ? error.message : 'Pagination is invalid',
    );
  }
}
