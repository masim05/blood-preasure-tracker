export type MeasurementImageProps = {
  id: string;
  measurementId: string;
  storagePath: string;
  contentType: 'image/jpeg' | 'image/png';
  byteSize: number;
  createdAt: Date;
};

export class MeasurementImage {
  readonly id: string;
  readonly measurementId: string;
  readonly storagePath: string;
  readonly contentType: 'image/jpeg' | 'image/png';
  readonly byteSize: number;
  readonly createdAt: Date;

  constructor(props: MeasurementImageProps) {
    if (!props.id) {
      throw new Error('MeasurementImage.id is required');
    }
    if (!props.measurementId) {
      throw new Error('MeasurementImage.measurementId is required');
    }
    if (!props.storagePath) {
      throw new Error('MeasurementImage.storagePath is required');
    }
    if (props.byteSize <= 0) {
      throw new Error('MeasurementImage.byteSize must be positive');
    }

    this.id = props.id;
    this.measurementId = props.measurementId;
    this.storagePath = props.storagePath;
    this.contentType = props.contentType;
    this.byteSize = props.byteSize;
    this.createdAt = new Date(props.createdAt);
  }

  toJSON(): MeasurementImageProps {
    return {
      id: this.id,
      measurementId: this.measurementId,
      storagePath: this.storagePath,
      contentType: this.contentType,
      byteSize: this.byteSize,
      createdAt: new Date(this.createdAt),
    };
  }
}
