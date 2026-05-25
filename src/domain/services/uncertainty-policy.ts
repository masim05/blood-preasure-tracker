import type { PredictedReadingProps, ReadingStatus } from '../entities/predicted-reading';

const trackedFields = ['time', 'hand', 'systolic', 'diastolic', 'pulse'] as const;

export function deriveReadingStatus(
  fields: Pick<
    PredictedReadingProps,
    'time' | 'hand' | 'systolic' | 'diastolic' | 'pulse' | 'uncertainFields'
  >,
): ReadingStatus {
  const hasAnyValue = trackedFields.some((field) => fields[field] !== null);
  const hasUncertainFields = fields.uncertainFields.length > 0;

  if (!hasAnyValue && hasUncertainFields) {
    return 'unreadable';
  }

  if (hasAnyValue && hasUncertainFields) {
    return 'partial';
  }

  if (hasAnyValue) {
    return 'complete';
  }

  return 'error';
}