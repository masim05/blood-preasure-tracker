import type { GroundTruthDatasetRow } from '../../application/ports/evaluation-dataset.port';

export type GroundTruthRecordProps = GroundTruthDatasetRow;

export class GroundTruthRecord {
  readonly imageId: string;
  readonly time: string | null;
  readonly hand: 'left' | 'right' | 'unknown' | null;
  readonly systolic: number | null;
  readonly diastolic: number | null;
  readonly pulse: number | null;

  constructor(props: GroundTruthRecordProps) {
    if (!props.imageId) {
      throw new Error('GroundTruthRecord.imageId is required');
    }

    this.imageId = props.imageId;
    this.time = props.time;
    this.hand = props.hand;
    this.systolic = props.systolic;
    this.diastolic = props.diastolic;
    this.pulse = props.pulse;
  }

  toJSON(): GroundTruthRecordProps {
    return {
      imageId: this.imageId,
      time: this.time,
      hand: this.hand,
      systolic: this.systolic,
      diastolic: this.diastolic,
      pulse: this.pulse,
    };
  }
}