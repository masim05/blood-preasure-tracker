import type { AccuracySummary } from '../entities/evaluation-report';

type AccuracyOutputRow = {
  label: string;
  correct: number;
  total: number;
  ratio: number;
};

export function formatEvaluationAccuracySummary(summary: AccuracySummary): string {
  const rows = toRows(summary);
  const labelWidth = Math.max(...rows.map((row) => `${row.label}:`.length));
  const fractionWidth = Math.max(...rows.map((row) => formatFraction(row).length));
  const percentageWidth = Math.max(...rows.map((row) => formatPercentage(row.ratio).length));

  return `${rows
    .map((row) => {
      const label = `${row.label}:`.padEnd(labelWidth);
      const fraction = formatFraction(row).padStart(fractionWidth);
      const percentage = formatPercentage(row.ratio).padStart(percentageWidth);

      return `${label} ${fraction} (${percentage}%)`;
    })
    .join('\n')}\n`;
}

function toRows(summary: AccuracySummary): AccuracyOutputRow[] {
  return [
    ...summary.fields.map((metric) => ({
      label: metric.field,
      correct: metric.correct,
      total: metric.total,
      ratio: metric.ratio,
    })),
    ...summary.thresholds.map((metric) => ({
      label: `${metric.threshold} params correct`,
      correct: metric.correct,
      total: metric.total,
      ratio: metric.ratio,
    })),
  ];
}

function formatFraction(row: Pick<AccuracyOutputRow, 'correct' | 'total'>): string {
  return `${row.correct}/${row.total}`;
}

function formatPercentage(ratio: number): string {
  return ratio.toFixed(1);
}