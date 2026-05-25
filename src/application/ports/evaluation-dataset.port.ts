export type GroundTruthDatasetRow = {
  imageId: string;
  time: string | null;
  hand: 'left' | 'right' | 'unknown' | null;
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
};

export interface EvaluationDatasetPort {
  load(csvPath: string): Promise<GroundTruthDatasetRow[]>;
}