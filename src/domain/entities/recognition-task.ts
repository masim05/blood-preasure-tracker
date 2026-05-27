export type RecognitionTaskStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type RecognitionTaskProps = {
  id: string;
  measurementId: string;
  status: RecognitionTaskStatus;
  attemptCount: number;
  lastError: string | null;
  availableAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class RecognitionTask {
  readonly id: string;
  readonly measurementId: string;
  readonly status: RecognitionTaskStatus;
  readonly attemptCount: number;
  readonly lastError: string | null;
  readonly availableAt: Date;
  readonly startedAt: Date | null;
  readonly completedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: RecognitionTaskProps) {
    if (!props.id) {
      throw new Error('RecognitionTask.id is required');
    }
    if (!props.measurementId) {
      throw new Error('RecognitionTask.measurementId is required');
    }
    if (props.attemptCount < 0) {
      throw new Error('RecognitionTask.attemptCount cannot be negative');
    }

    this.id = props.id;
    this.measurementId = props.measurementId;
    this.status = props.status;
    this.attemptCount = props.attemptCount;
    this.lastError = props.lastError;
    this.availableAt = new Date(props.availableAt);
    this.startedAt = props.startedAt ? new Date(props.startedAt) : null;
    this.completedAt = props.completedAt ? new Date(props.completedAt) : null;
    this.createdAt = new Date(props.createdAt);
    this.updatedAt = new Date(props.updatedAt);
  }

  toJSON(): RecognitionTaskProps {
    return {
      id: this.id,
      measurementId: this.measurementId,
      status: this.status,
      attemptCount: this.attemptCount,
      lastError: this.lastError,
      availableAt: new Date(this.availableAt),
      startedAt: this.startedAt ? new Date(this.startedAt) : null,
      completedAt: this.completedAt ? new Date(this.completedAt) : null,
      createdAt: new Date(this.createdAt),
      updatedAt: new Date(this.updatedAt),
    };
  }
}
