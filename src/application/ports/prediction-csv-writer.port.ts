import type { PredictedReading } from '../../domain/entities/predicted-reading';

export interface PredictionCsvWriterPort {
  open(inputDirectory: string): Promise<void>;
  write(reading: PredictedReading): Promise<void>;
  close(): Promise<void>;
}