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
});
