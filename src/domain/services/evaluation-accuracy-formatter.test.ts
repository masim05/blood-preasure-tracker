import { formatEvaluationAccuracySummary } from './evaluation-accuracy-formatter';
import type { AccuracySummary } from '../entities/evaluation-report';

const summary: AccuracySummary = {
  comparableTotal: 31,
  fields: [
    { field: 'hand', correct: 27, total: 31, ratio: 87.09677419354838 },
    { field: 'systolic', correct: 31, total: 31, ratio: 100 },
    { field: 'diastolic', correct: 30, total: 31, ratio: 96.7741935483871 },
    { field: 'pulse', correct: 31, total: 31, ratio: 100 },
  ],
  thresholds: [
    { threshold: 2, correct: 31, total: 31, ratio: 100 },
    { threshold: 3, correct: 30, total: 31, ratio: 96.7741935483871 },
    { threshold: 4, correct: 27, total: 31, ratio: 87.09677419354838 },
  ],
};

describe('formatEvaluationAccuracySummary', () => {
  it('formats per-field and threshold rows with one-decimal percentages', () => {
    expect(formatEvaluationAccuracySummary(summary)).toBe([
      'hand:             27/31 ( 87.1%)',
      'systolic:         31/31 (100.0%)',
      'diastolic:        30/31 ( 96.8%)',
      'pulse:            31/31 (100.0%)',
      '2 params correct: 31/31 (100.0%)',
      '3 params correct: 30/31 ( 96.8%)',
      '4 params correct: 27/31 ( 87.1%)',
      '',
    ].join('\n'));
  });

  it('aligns fractions and percentages across rows', () => {
    const lines = formatEvaluationAccuracySummary(summary).trimEnd().split('\n');
    const fractionColumns = lines.map((line) => line.search(/\d+\/\d+/));
    const percentageColumns = lines.map((line) => line.indexOf('('));

    expect(new Set(fractionColumns)).toEqual(new Set([18]));
    expect(new Set(percentageColumns)).toEqual(new Set([24]));
  });

  it('renders zero comparable records without division by zero', () => {
    const zeroSummary: AccuracySummary = {
      comparableTotal: 0,
      fields: [
        { field: 'hand', correct: 0, total: 0, ratio: 0 },
        { field: 'systolic', correct: 0, total: 0, ratio: 0 },
        { field: 'diastolic', correct: 0, total: 0, ratio: 0 },
        { field: 'pulse', correct: 0, total: 0, ratio: 0 },
      ],
      thresholds: [
        { threshold: 2, correct: 0, total: 0, ratio: 0 },
        { threshold: 3, correct: 0, total: 0, ratio: 0 },
        { threshold: 4, correct: 0, total: 0, ratio: 0 },
      ],
    };

    const lines = formatEvaluationAccuracySummary(zeroSummary).trimEnd().split('\n');

    expect(lines).toHaveLength(7);
    expect(lines[0]).toContain('0/0 (0.0%)');
    expect(lines.every((line) => line.includes('0/0 (0.0%)'))).toBe(true);
  });

  it('keeps the requested summary under the ten-line cap', () => {
    expect(formatEvaluationAccuracySummary(summary).trimEnd().split('\n')).toHaveLength(7);
  });
});