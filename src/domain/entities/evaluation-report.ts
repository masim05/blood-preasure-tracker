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

export type AccuracyTargetField = 'hand' | 'systolic' | 'diastolic' | 'pulse';

export type FieldAccuracyMetric = {
  field: AccuracyTargetField;
  correct: number;
  total: number;
  ratio: number;
};

export type ParameterThresholdMetric = {
  threshold: 2 | 3 | 4;
  correct: number;
  total: number;
  ratio: number;
};

export type AccuracySummary = {
  comparableTotal: number;
  fields: FieldAccuracyMetric[];
  thresholds: ParameterThresholdMetric[];
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

const accuracyTargetFields: AccuracyTargetField[] = ['hand', 'systolic', 'diastolic', 'pulse'];
const accuracyThresholds: Array<2 | 3 | 4> = [2, 3, 4];

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
      totalImages: this.comparisons.filter((comparison) => comparison.prediction !== null).length,
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

  toAccuracySummary(): AccuracySummary {
    const comparableComparisons = this.comparisons.filter(
      (comparison) => comparison.prediction !== null && comparison.groundTruth !== null,
    );
    const comparableTotal = comparableComparisons.length;

    return {
      comparableTotal,
      fields: accuracyTargetFields.map((field) => {
        const correct = comparableComparisons.filter(
          (comparison) => comparison.fieldResults[field] === 'match',
        ).length;

        return createFieldMetric(field, correct, comparableTotal);
      }),
      thresholds: accuracyThresholds.map((threshold) => {
        const correct = comparableComparisons.filter(
          (comparison) => countCorrectTargetFields(comparison.fieldResults) >= threshold,
        ).length;

        return createThresholdMetric(threshold, correct, comparableTotal);
      }),
    };
  }

  private countByStatus(status: MatchStatus): number {
    return this.comparisons.filter((comparison) => comparison.matchStatus === status).length;
  }
}

function createFieldMetric(
  field: AccuracyTargetField,
  correct: number,
  total: number,
): FieldAccuracyMetric {
  return {
    field,
    correct,
    total,
    ratio: calculateRatio(correct, total),
  };
}

function createThresholdMetric(
  threshold: 2 | 3 | 4,
  correct: number,
  total: number,
): ParameterThresholdMetric {
  return {
    threshold,
    correct,
    total,
    ratio: calculateRatio(correct, total),
  };
}

function countCorrectTargetFields(fieldResults: EvaluationFieldResults): number {
  return accuracyTargetFields.filter((field) => fieldResults[field] === 'match').length;
}

function calculateRatio(correct: number, total: number): number {
  return total === 0 ? 0 : (correct / total) * 100;
}