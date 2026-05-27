export type MeasurementStatus = 'pending' | 'recognizing' | 'recognized' | 'saved' | 'failed';
export type ArmSide = 'left' | 'right' | 'unknown';

export type MeasurementProps = {
  id: string;
  userId: string;
  status: MeasurementStatus;
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  armSide: ArmSide | null;
  measurementTime: Date;
  imageId: string | null;
  recognitionError: string | null;
  savedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class Measurement {
  readonly id: string;
  readonly userId: string;
  readonly status: MeasurementStatus;
  readonly systolic: number | null;
  readonly diastolic: number | null;
  readonly pulse: number | null;
  readonly armSide: ArmSide | null;
  readonly measurementTime: Date;
  readonly imageId: string | null;
  readonly recognitionError: string | null;
  readonly savedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: MeasurementProps) {
    if (!props.id) {
      throw new Error('Measurement.id is required');
    }
    if (!props.userId) {
      throw new Error('Measurement.userId is required');
    }
    validateRecognizedValues(props);

    this.id = props.id;
    this.userId = props.userId;
    this.status = props.status;
    this.systolic = props.systolic;
    this.diastolic = props.diastolic;
    this.pulse = props.pulse;
    this.armSide = props.armSide;
    this.measurementTime = new Date(props.measurementTime);
    this.imageId = props.imageId;
    this.recognitionError = props.recognitionError;
    this.savedAt = props.savedAt ? new Date(props.savedAt) : null;
    this.createdAt = new Date(props.createdAt);
    this.updatedAt = new Date(props.updatedAt);
  }

  toJSON(): MeasurementProps {
    return {
      id: this.id,
      userId: this.userId,
      status: this.status,
      systolic: this.systolic,
      diastolic: this.diastolic,
      pulse: this.pulse,
      armSide: this.armSide,
      measurementTime: new Date(this.measurementTime),
      imageId: this.imageId,
      recognitionError: this.recognitionError,
      savedAt: this.savedAt ? new Date(this.savedAt) : null,
      createdAt: new Date(this.createdAt),
      updatedAt: new Date(this.updatedAt),
    };
  }
}

function validateRecognizedValues(props: MeasurementProps): void {
  if ((props.status === 'recognized' || props.status === 'saved') && !hasAllValues(props)) {
    throw new Error('Measurement.recognized status requires all recognized values');
  }

  if (props.status === 'saved' && props.savedAt === null) {
    throw new Error('Measurement.saved status requires savedAt');
  }

  if (props.status !== 'saved' && props.savedAt !== null) {
    throw new Error('Measurement.savedAt is only allowed for saved measurements');
  }
}

function hasAllValues(props: MeasurementProps): boolean {
  return (
    props.systolic !== null &&
    props.diastolic !== null &&
    props.pulse !== null &&
    props.armSide !== null
  );
}
