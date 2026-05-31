import type { Measurement } from '../../domain/entities/measurement';

export const MEASUREMENT_STORE = Symbol('MEASUREMENT_STORE');

export type ListMeasurementsFilter = {
  userId: string;
  page: number;
  pageSize: number;
  from: Date | null;
  to: Date | null;
};

export type MeasurementHistoryPage = {
  items: Measurement[];
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  from: Date | null;
  to: Date | null;
};

export interface MeasurementStorePort {
  findById(id: string): Promise<Measurement | null>;
  findByIdForUser(id: string, userId: string): Promise<Measurement | null>;
  save(measurement: Measurement): Promise<void>;
  listHistoryForUser(filter: ListMeasurementsFilter): Promise<MeasurementHistoryPage>;
}
