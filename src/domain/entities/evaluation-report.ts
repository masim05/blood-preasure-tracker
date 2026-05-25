import type { GroundTruthRecordProps } from './ground-truth-record';
import type { PredictedReadingProps } from './predicted-reading';

export type FieldResult = 'match' | 'mismatch' | 'missing';
export type MatchStatus = 'matched' | 'mismatch' | 'prediction-missing' | 'ground-truth-missing';

export type EvaluationFieldResults = {
  time: FieldResult;
  hand: FieldResult;
  systolic: FieldResult;
  diastolic: FieldResult;
  pulse: FieldResult;
};

export type EvaluationComparison = {
  imageId: string;
  matchStatus: MatchStatus;
  prediction: PredictedReadingProps | null;
  groundTruth: GroundTruthRecordProps | null;
  fieldResults: EvaluationFieldResults;
  notes: string[];
};

export type EvaluationSummary = {
  type: 'summary';
  totalImages: number;
  totalGroundTruthRows: number;
  matchedRecords: number;
  mismatchedRecords: number;
  predictionMissing: number;
  groundTruthMissing: number;
  errorCount: number;
  provider: string;
  model: string;
};

export const EMPTY_FIELD_RESULTS: EvaluationFieldResults = {
  time: 'missing',
  hand: 'missing',
  systolic: 'missing',
  diastolic: 'missing',
  pulse: 'missing',
};

export class EvaluationReport {
  constructor(
    private readonly comparisons: EvaluationComparison[],
    private readonly totalGroundTruthRows: number,
    private readonly provider: string,
    private readonly model: string,
  ) {}

  toComparisonRecords(): Array<EvaluationComparison & { type: 'comparison' }> {
    return this.comparisons.map((comparison) => ({
      type: 'comparison',
      ...comparison,
    }));
  }

  toSummary(): EvaluationSummary {
    return {
      type: 'summary',
      totalImages: this.comparisons.length,
      totalGroundTruthRows: this.totalGroundTruthRows,
      matchedRecords: this.countByStatus('matched'),
      mismatchedRecords: this.countByStatus('mismatch'),
      predictionMissing: this.countByStatus('prediction-missing'),
      groundTruthMissing: this.countByStatus('ground-truth-missing'),
      errorCount: this.comparisons.filter((comparison) => comparison.prediction?.status === 'error').length,
      provider: this.provider,
      model: this.model,
    };
  }

  private countByStatus(status: MatchStatus): number {
    return this.comparisons.filter((comparison) => comparison.matchStatus === status).length;
  }
}