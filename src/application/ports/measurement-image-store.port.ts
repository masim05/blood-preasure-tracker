import type { MeasurementImage } from '../../domain/entities/measurement-image';

export const MEASUREMENT_IMAGE_STORE = Symbol('MEASUREMENT_IMAGE_STORE');

export type StoreMeasurementImageInput = {
  id: string;
  measurementId: string;
  contentType: 'image/jpeg' | 'image/png';
  data: Buffer;
  originalName: string;
  createdAt: Date;
};

export type StoredMeasurementImageData = {
  image: MeasurementImage;
  data: Buffer;
};

export interface MeasurementImageStorePort {
  save(input: StoreMeasurementImageInput): Promise<MeasurementImage>;
  findByMeasurementId(measurementId: string): Promise<MeasurementImage | null>;
  readByMeasurementId(measurementId: string): Promise<StoredMeasurementImageData | null>;
  getImageUrl(measurementId: string): string;
}
