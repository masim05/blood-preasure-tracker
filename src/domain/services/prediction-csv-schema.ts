import type { PredictedReading, PredictedReadingProps } from '../entities/predicted-reading';
import { formatCsvRow, type CsvCellValue } from './csv-formatting';

export const predictionCsvHeader = [
  'imageId',
  'time',
  'hand',
  'systolic',
  'diastolic',
  'pulse',
  'status',
  'confidence',
  'uncertainFields',
  'provider',
  'model',
  'rawNotes',
] as const;

export type PredictionCsvHeader = (typeof predictionCsvHeader)[number];

export type PredictionCsvRow = Record<PredictionCsvHeader, CsvCellValue>;

export function formatPredictionCsvHeader(): string {
  return formatCsvRow(predictionCsvHeader);
}

export function toPredictionCsvRow(reading: PredictedReading | PredictedReadingProps): PredictionCsvRow {
  const json = 'toJSON' in reading ? reading.toJSON() : reading;

  return {
    imageId: json.imageId,
    time: json.time,
    hand: json.hand,
    systolic: json.systolic,
    diastolic: json.diastolic,
    pulse: json.pulse,
    status: json.status,
    confidence: json.confidence,
    uncertainFields: JSON.stringify(json.uncertainFields),
    provider: json.provider,
    model: json.model,
    rawNotes: json.rawNotes,
  };
}

export function formatPredictionCsvRow(reading: PredictedReading | PredictedReadingProps): string {
  const row = toPredictionCsvRow(reading);
  return formatCsvRow(predictionCsvHeader.map((header) => row[header]));
}