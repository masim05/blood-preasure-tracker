import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  EvaluationDatasetPort,
  GroundTruthDatasetRow,
} from '../../../application/ports/evaluation-dataset.port';
import { GroundTruthRecord } from '../../../domain/entities/ground-truth-record';

const requiredHeaders = ['imageId', 'time', 'hand', 'systolic', 'diastolic', 'pulse'] as const;

@Injectable()
export class CsvDatasetAdapter implements EvaluationDatasetPort {
  async load(csvPath: string): Promise<GroundTruthDatasetRow[]> {
    const content = await readFile(csvPath, 'utf8');
    return this.parse(content);
  }

  async parse(content: string): Promise<GroundTruthDatasetRow[]> {
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return [];
    }

    const headers = splitCsvLine(lines[0]!);
    validateHeaders(headers);
    const headerIndex = createHeaderIndex(headers);
    const records: GroundTruthDatasetRow[] = [];
    const seenImageIds = new Set<string>();

    for (const line of lines.slice(1)) {
      const columns = splitCsvLine(line);
      const imageId = normalizeStem(columns[headerIndex.imageId] ?? '');
      if (seenImageIds.has(imageId)) {
        throw new Error(`Duplicate imageId: ${imageId}`);
      }

      seenImageIds.add(imageId);

      const record = new GroundTruthRecord({
        imageId,
        time: nullableString(columns[headerIndex.time]),
        hand: nullableHand(columns[headerIndex.hand]),
        systolic: nullableNumber(columns[headerIndex.systolic]),
        diastolic: nullableNumber(columns[headerIndex.diastolic]),
        pulse: nullableNumber(columns[headerIndex.pulse]),
      });

      records.push(record.toJSON());
    }

    return records;
  }
}

function splitCsvLine(line: string): string[] {
  return line.split(',').map((value) => value.trim());
}

function validateHeaders(headers: string[]): void {
  for (const header of requiredHeaders) {
    if (!headers.includes(header)) {
      throw new Error(`Missing required CSV header: ${header}`);
    }
  }
}

function createHeaderIndex(headers: string[]): Record<(typeof requiredHeaders)[number], number> {
  return {
    imageId: headers.indexOf('imageId'),
    time: headers.indexOf('time'),
    hand: headers.indexOf('hand'),
    systolic: headers.indexOf('systolic'),
    diastolic: headers.indexOf('diastolic'),
    pulse: headers.indexOf('pulse'),
  };
}

function nullableString(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

function nullableHand(value: string | undefined): 'left' | 'right' | 'unknown' | null {
  if (!value) {
    return null;
  }

  if (value === 'left' || value === 'right' || value === 'unknown') {
    return value;
  }

  throw new Error(`Unsupported hand value: ${value}`);
}

function nullableNumber(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }

  return parsed;
}

function normalizeStem(imageId: string): string {
  const parsed = path.parse(imageId).name;
  return parsed || imageId;
}