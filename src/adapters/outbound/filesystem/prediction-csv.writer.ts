import { Injectable } from '@nestjs/common';
import { createWriteStream, type WriteStream } from 'node:fs';
import path from 'node:path';
import type { Writable } from 'node:stream';

import type { PredictionCsvWriterPort } from '../../../application/ports/prediction-csv-writer.port';
import type { PredictedReading } from '../../../domain/entities/predicted-reading';
import { formatPredictionCsvHeader, formatPredictionCsvRow } from '../../../domain/services/prediction-csv-schema';

type CreateWriteStream = (filePath: string) => Writable;

@Injectable()
export class PredictionCsvFileWriter implements PredictionCsvWriterPort {
  private stream: Writable | null = null;
  private csvPath: string | null = null;

  constructor(private readonly streamFactory: CreateWriteStream = (filePath) => createWriteStream(filePath, { flags: 'w' })) {}

  async open(inputDirectory: string): Promise<void> {
    if (this.stream) {
      throw new Error('Prediction CSV writer is already open');
    }

    const csvPath = path.join(inputDirectory, 'p.csv');
    const stream = this.streamFactory(csvPath);
    this.csvPath = csvPath;
    this.stream = stream;

    try {
      await this.writeChunk(`${formatPredictionCsvHeader()}\n`);
    } catch (error) {
      this.reset();
      stream.destroy();
      throw error;
    }
  }

  async write(reading: PredictedReading): Promise<void> {
    await this.writeChunk(`${formatPredictionCsvRow(reading)}\n`);
  }

  async close(): Promise<void> {
    if (!this.stream) {
      return;
    }

    const stream = this.stream;
    const csvPath = this.csvPath;
    this.reset();

    await new Promise<void>((resolve, reject) => {
      const cleanup = (): void => {
        stream.off('finish', onFinish);
        stream.off('error', onError);
      };
      const onFinish = (): void => {
        cleanup();
        resolve();
      };
      const onError = (error: Error): void => {
        cleanup();
        reject(this.wrapError('close', error, csvPath));
      };

      stream.once('finish', onFinish);
      stream.once('error', onError);
      stream.end();
    });
  }

  private async writeChunk(chunk: string): Promise<void> {
    if (!this.stream || !this.csvPath) {
      throw new Error('Prediction CSV writer is not open');
    }

    const stream = this.stream;

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const cleanup = (): void => {
        stream.off('drain', onDrain);
        stream.off('error', onError);
      };
      const settle = (callback: () => void): void => {
        if (settled) {
          return;
        }

        settled = true;
        cleanup();
        callback();
      };
      const onDrain = (): void => {
        settle(resolve);
      };
      const onError = (error: Error): void => {
        settle(() => {
          reject(this.wrapError('write', error));
        });
      };

      stream.once('error', onError);
      const canContinue = stream.write(chunk, (error?: Error | null) => {
        if (error) {
          stream.once('error', () => undefined);
          settle(() => {
            reject(this.wrapError('write', error));
          });
          return;
        }

        if (canContinue) {
          settle(resolve);
        }
      });

      if (!canContinue) {
        stream.once('drain', onDrain);
      }
    });
  }

  private wrapError(action: 'write' | 'close', error: Error, csvPath: string | null = this.csvPath): Error {
    return new Error(`Failed to ${action} prediction CSV at ${csvPath ?? 'p.csv'}: ${error.message}`);
  }

  private reset(): void {
    this.stream = null;
    this.csvPath = null;
  }
}

export type PredictionCsvWriteStream = WriteStream;