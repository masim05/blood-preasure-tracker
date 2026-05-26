import path from 'node:path';

import {
  EMPTY_FIELD_RESULTS,
  type EvaluationComparison,
  type EvaluationFieldResults,
} from '../entities/evaluation-report';
import type { GroundTruthRecord, GroundTruthRecordProps } from '../entities/ground-truth-record';
import type { PredictedReading, PredictedReadingProps } from '../entities/predicted-reading';

const trackedFields = ['time', 'hand', 'systolic', 'diastolic', 'pulse'] as const;

export class EvaluationMatcher {
  match(
    predictions: Array<PredictedReading | PredictedReadingProps>,
    groundTruthRows: Array<GroundTruthRecord | GroundTruthRecordProps>,
  ): EvaluationComparison[] {
    const predictionEntries = toPredictionEntries(predictions);
    const groundTruthEntries = toGroundTruthEntries(groundTruthRows);
    const predictionMap = toUniqueStemMap(predictionEntries, 'predictions');
    const groundTruthMap = toUniqueStemMap(groundTruthEntries, 'ground truth');
    const comparisons: EvaluationComparison[] = [];

    for (const entry of predictionEntries) {
      const stem = normalizeStem(entry.imageId);
      const groundTruth = groundTruthMap.get(stem);

      if (!groundTruth) {
        comparisons.push({
          imageId: stem,
          matchStatus: 'ground-truth-missing',
          prediction: entry,
          groundTruth: null,
          fieldResults: { ...EMPTY_FIELD_RESULTS },
          notes: [`No ground truth row found for imageId ${stem}`],
        });
        continue;
      }

      const fieldResults = compareFields(entry, groundTruth);
      comparisons.push({
        imageId: stem,
        matchStatus: Object.values(fieldResults).every((result) => result === 'match')
          ? 'matched'
          : 'mismatch',
        prediction: entry,
        groundTruth,
        fieldResults,
        notes: [],
      });
    }

    for (const entry of groundTruthEntries) {
      const stem = normalizeStem(entry.imageId);
      if (predictionMap.has(stem)) {
        continue;
      }

      comparisons.push({
        imageId: stem,
        matchStatus: 'prediction-missing',
        prediction: null,
        groundTruth: entry,
        fieldResults: { ...EMPTY_FIELD_RESULTS },
        notes: [`No prediction record found for imageId ${stem}`],
      });
    }

    return comparisons;
  }
}

function compareFields(
  prediction: PredictedReadingProps,
  groundTruth: GroundTruthRecordProps,
): EvaluationFieldResults {
  return trackedFields.reduce<EvaluationFieldResults>(
    (results, field) => {
      const predictedValue = prediction[field];
      const groundTruthValue = groundTruth[field];

      results[field] =
        predictedValue === null || groundTruthValue === null
          ? 'missing'
          : predictedValue === groundTruthValue
            ? 'match'
            : 'mismatch';

      return results;
    },
    { ...EMPTY_FIELD_RESULTS },
  );
}

function toPredictionEntries(
  predictions: Array<PredictedReading | PredictedReadingProps>,
): PredictedReadingProps[] {
  return predictions.map((prediction) =>
    'toJSON' in prediction ? prediction.toJSON() : prediction,
  );
}

function toGroundTruthEntries(
  groundTruthRows: Array<GroundTruthRecord | GroundTruthRecordProps>,
): GroundTruthRecordProps[] {
  return groundTruthRows.map((groundTruth) =>
    'toJSON' in groundTruth ? groundTruth.toJSON() : groundTruth,
  );
}

function toUniqueStemMap<T extends { imageId: string }>(
  entries: T[],
  sourceLabel: string,
): Map<string, T> {
  const map = new Map<string, T>();

  for (const entry of entries) {
    const stem = normalizeStem(entry.imageId);
    if (map.has(stem)) {
      throw new Error(`Duplicate filename stem in ${sourceLabel}: ${stem}`);
    }

    map.set(stem, entry);
  }

  return map;
}

function normalizeStem(imageId: string): string {
  const parsed = path.parse(imageId).name;
  return parsed || imageId;
}