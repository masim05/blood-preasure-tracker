export type ReadingHand = 'left' | 'right' | 'unknown' | null;
export type ReadingStatus = 'complete' | 'partial' | 'unreadable' | 'error';

export type PredictedReadingProps = {
  imageId: string;
  imagePath: string;
  time: string | null;
  hand: ReadingHand;
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  confidence: number | null;
  status: ReadingStatus;
  uncertainFields: string[];
  provider: string;
  model: string;
  rawNotes: string | null;
};

export class PredictedReading {
  readonly imageId: string;
  readonly imagePath: string;
  readonly time: string | null;
  readonly hand: ReadingHand;
  readonly systolic: number | null;
  readonly diastolic: number | null;
  readonly pulse: number | null;
  readonly confidence: number | null;
  readonly status: ReadingStatus;
  readonly uncertainFields: string[];
  readonly provider: string;
  readonly model: string;
  readonly rawNotes: string | null;

  constructor(props: PredictedReadingProps) {
    validatePredictedReading(props);

    this.imageId = props.imageId;
    this.imagePath = props.imagePath;
    this.time = props.time;
    this.hand = props.hand;
    this.systolic = props.systolic;
    this.diastolic = props.diastolic;
    this.pulse = props.pulse;
    this.confidence = props.confidence;
    this.status = props.status;
    this.uncertainFields = [...props.uncertainFields];
    this.provider = props.provider;
    this.model = props.model;
    this.rawNotes = props.rawNotes;
  }

  toJSON(): PredictedReadingProps {
    return {
      imageId: this.imageId,
      imagePath: this.imagePath,
      time: this.time,
      hand: this.hand,
      systolic: this.systolic,
      diastolic: this.diastolic,
      pulse: this.pulse,
      confidence: this.confidence,
      status: this.status,
      uncertainFields: [...this.uncertainFields],
      provider: this.provider,
      model: this.model,
      rawNotes: this.rawNotes,
    };
  }
}

function validatePredictedReading(props: PredictedReadingProps): void {
  if (!props.imageId) {
    throw new Error('PredictedReading.imageId is required');
  }

  if (!props.imagePath) {
    throw new Error('PredictedReading.imagePath is required');
  }

  if (props.confidence !== null && (props.confidence < 0 || props.confidence > 1)) {
    throw new Error('PredictedReading.confidence must be between 0 and 1');
  }

  if (props.status === 'complete' && props.uncertainFields.length > 0) {
    throw new Error('PredictedReading.complete status cannot include uncertain fields');
  }

  if (props.status === 'partial' && props.uncertainFields.length === 0) {
    throw new Error('PredictedReading.partial status requires uncertain fields');
  }

  if (props.status === 'unreadable' && hasReadableMedicalValue(props)) {
    throw new Error('PredictedReading.unreadable status cannot include medical values');
  }
}

function hasReadableMedicalValue(props: PredictedReadingProps): boolean {
  return props.systolic !== null || props.diastolic !== null || props.pulse !== null;
}