import { EvaluationReport, type EvaluationComparison } from '../../../src/domain/entities/evaluation-report';

const prediction = {
  imageId: 'img001',
  imagePath: 'data/eval/img001.jpg',
  time: '2026-05-20 14:01:23',
  hand: 'right' as const,
  systolic: 127,
  diastolic: 72,
  pulse: 69,
  confidence: 0.95,
  status: 'complete' as const,
  uncertainFields: [],
  provider: 'openai',
  model: 'gpt-5.4-mini',
  rawNotes: null,
};

const groundTruth = {
  imageId: 'img001',
  time: '2026-05-20 14:01:23',
  hand: 'right' as const,
  systolic: 127,
  diastolic: 72,
  pulse: 69,
};

const fieldResults = {
  time: 'match' as const,
  hand: 'match' as const,
  systolic: 'match' as const,
  diastolic: 'match' as const,
  pulse: 'match' as const,
};

describe('EvaluationReport', () => {
  it('counts totalImages from processed predictions, not unmatched CSV rows', () => {
    const comparisons: EvaluationComparison[] = [
      {
        imageId: 'img001',
        matchStatus: 'matched',
        prediction,
        groundTruth,
        fieldResults,
        notes: [],
      },
      {
        imageId: 'csv-only',
        matchStatus: 'prediction-missing',
        prediction: null,
        groundTruth: { ...groundTruth, imageId: 'csv-only' },
        fieldResults: {
          time: 'missing',
          hand: 'missing',
          systolic: 'missing',
          diastolic: 'missing',
          pulse: 'missing',
        },
        notes: ['No prediction record found for imageId csv-only'],
      },
    ];

    const summary = new EvaluationReport(comparisons, 2, 'openai', 'gpt-5.4-mini').toSummary();

    expect(summary).toMatchObject({
      totalImages: 1,
      totalGroundTruthRows: 2,
      matchedRecords: 1,
      predictionMissing: 1,
    });
  });

  it('calculates per-field accuracy for comparable records only', () => {
    const comparisons: EvaluationComparison[] = [
      {
        imageId: 'img001',
        matchStatus: 'mismatch',
        prediction,
        groundTruth,
        fieldResults: {
          time: 'mismatch',
          hand: 'match',
          systolic: 'match',
          diastolic: 'mismatch',
          pulse: 'missing',
        },
        notes: [],
      },
      {
        imageId: 'img002',
        matchStatus: 'matched',
        prediction: { ...prediction, imageId: 'img002', hand: 'left' },
        groundTruth: { ...groundTruth, imageId: 'img002', hand: 'left' },
        fieldResults,
        notes: [],
      },
      {
        imageId: 'csv-only',
        matchStatus: 'prediction-missing',
        prediction: null,
        groundTruth: { ...groundTruth, imageId: 'csv-only' },
        fieldResults: {
          time: 'missing',
          hand: 'missing',
          systolic: 'missing',
          diastolic: 'missing',
          pulse: 'missing',
        },
        notes: ['No prediction record found for imageId csv-only'],
      },
    ];

    const accuracy = new EvaluationReport(comparisons, 3, 'openai', 'gpt-5.4-mini').toAccuracySummary();

    expect(accuracy.comparableTotal).toBe(2);
    expect(accuracy.fields).toEqual([
      { field: 'hand', correct: 2, total: 2, ratio: 100 },
      { field: 'systolic', correct: 2, total: 2, ratio: 100 },
      { field: 'diastolic', correct: 1, total: 2, ratio: 50 },
      { field: 'pulse', correct: 1, total: 2, ratio: 50 },
    ]);
  });

  it('counts missing field outcomes as incorrect and excludes unmatched rows from denominators', () => {
    const comparisons: EvaluationComparison[] = [
      {
        imageId: 'img001',
        matchStatus: 'mismatch',
        prediction: { ...prediction, hand: null },
        groundTruth,
        fieldResults: {
          time: 'match',
          hand: 'missing',
          systolic: 'match',
          diastolic: 'match',
          pulse: 'match',
        },
        notes: [],
      },
      {
        imageId: 'prediction-only',
        matchStatus: 'ground-truth-missing',
        prediction: { ...prediction, imageId: 'prediction-only' },
        groundTruth: null,
        fieldResults: {
          time: 'missing',
          hand: 'missing',
          systolic: 'missing',
          diastolic: 'missing',
          pulse: 'missing',
        },
        notes: ['No ground truth row found for imageId prediction-only'],
      },
    ];

    const accuracy = new EvaluationReport(comparisons, 1, 'openai', 'gpt-5.4-mini').toAccuracySummary();

    expect(accuracy.comparableTotal).toBe(1);
    expect(accuracy.fields).toContainEqual({ field: 'hand', correct: 0, total: 1, ratio: 0 });
    expect(accuracy.fields).toContainEqual({ field: 'systolic', correct: 1, total: 1, ratio: 100 });
  });

  it('excludes errored predictions from accuracy denominators', () => {
    const comparisons: EvaluationComparison[] = [
      {
        imageId: 'errored',
        matchStatus: 'mismatch',
        prediction: {
          ...prediction,
          imageId: 'errored',
          hand: null,
          systolic: null,
          diastolic: null,
          pulse: null,
          status: 'error',
        },
        groundTruth: { ...groundTruth, imageId: 'errored' },
        fieldResults: {
          time: 'match',
          hand: 'missing',
          systolic: 'missing',
          diastolic: 'missing',
          pulse: 'missing',
        },
        notes: ['provider failed'],
      },
      {
        imageId: 'img002',
        matchStatus: 'matched',
        prediction: { ...prediction, imageId: 'img002' },
        groundTruth: { ...groundTruth, imageId: 'img002' },
        fieldResults,
        notes: [],
      },
    ];

    const accuracy = new EvaluationReport(comparisons, 2, 'openai', 'gpt-5.4-mini').toAccuracySummary();

    expect(accuracy.comparableTotal).toBe(1);
    expect(accuracy.fields).toEqual([
      { field: 'hand', correct: 1, total: 1, ratio: 100 },
      { field: 'systolic', correct: 1, total: 1, ratio: 100 },
      { field: 'diastolic', correct: 1, total: 1, ratio: 100 },
      { field: 'pulse', correct: 1, total: 1, ratio: 100 },
    ]);
  });

  it('calculates at-least threshold metrics for target parameters', () => {
    const comparisons: EvaluationComparison[] = [
      {
        imageId: 'img001',
        matchStatus: 'mismatch',
        prediction,
        groundTruth,
        fieldResults: {
          time: 'mismatch',
          hand: 'match',
          systolic: 'match',
          diastolic: 'mismatch',
          pulse: 'missing',
        },
        notes: [],
      },
      {
        imageId: 'img002',
        matchStatus: 'mismatch',
        prediction: { ...prediction, imageId: 'img002' },
        groundTruth: { ...groundTruth, imageId: 'img002' },
        fieldResults: {
          time: 'mismatch',
          hand: 'match',
          systolic: 'match',
          diastolic: 'match',
          pulse: 'mismatch',
        },
        notes: [],
      },
      {
        imageId: 'img003',
        matchStatus: 'matched',
        prediction: { ...prediction, imageId: 'img003' },
        groundTruth: { ...groundTruth, imageId: 'img003' },
        fieldResults,
        notes: [],
      },
    ];

    const accuracy = new EvaluationReport(comparisons, 3, 'openai', 'gpt-5.4-mini').toAccuracySummary();

    expect(accuracy.thresholds).toEqual([
      { threshold: 2, correct: 3, total: 3, ratio: 100 },
      { threshold: 3, correct: 2, total: 3, ratio: 66.66666666666666 },
      { threshold: 4, correct: 1, total: 3, ratio: 33.33333333333333 },
    ]);
  });

  it('returns zero accuracy metrics when no comparable records exist', () => {
    const accuracy = new EvaluationReport([], 0, 'openai', 'gpt-5.4-mini').toAccuracySummary();

    expect(accuracy.comparableTotal).toBe(0);
    expect(accuracy.fields.every((metric) => metric.correct === 0 && metric.total === 0 && metric.ratio === 0)).toBe(true);
    expect(accuracy.thresholds.every((metric) => metric.correct === 0 && metric.total === 0 && metric.ratio === 0)).toBe(true);
  });
});
