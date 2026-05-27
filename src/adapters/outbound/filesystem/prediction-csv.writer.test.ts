import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Writable } from 'node:stream';

import { PredictionCsvFileWriter } from './prediction-csv.writer';
import { PredictedReading } from '../../../domain/entities/predicted-reading';

describe('PredictionCsvFileWriter', () => {
  it('replaces stale p.csv content and writes the header and rows', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'bp-predict-csv-'));
    const csvPath = path.join(directory, 'p.csv');
    writeFileSync(csvPath, 'stale\n');
    const writer = new PredictionCsvFileWriter();

    await writer.open(directory);
    await writer.write(createReading({ rawNotes: 'contains, comma' }));
    await writer.close();

    expect(readFileSync(csvPath, 'utf8')).toBe(
      [
        'imageId,time,hand,systolic,diastolic,pulse,status,confidence,uncertainFields,provider,model,rawNotes',
        'img001,2026-05-20 14:01:23,right,127,72,69,complete,0.95,[],openai,gpt-5.4-mini,"contains, comma"',
        '',
      ].join('\n'),
    );
  });

  it('creates a header-only file when no rows are written', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'bp-predict-empty-'));
    const writer = new PredictionCsvFileWriter();

    await writer.open(directory);
    await writer.close();

    expect(readFileSync(path.join(directory, 'p.csv'), 'utf8')).toBe(
      'imageId,time,hand,systolic,diastolic,pulse,status,confidence,uncertainFields,provider,model,rawNotes\n',
    );
  });

  it('allows close before open', async () => {
    const writer = new PredictionCsvFileWriter();

    await expect(writer.close()).resolves.toBeUndefined();
  });

  it('rejects row writes before open', async () => {
    const writer = new PredictionCsvFileWriter();

    await expect(writer.write(createReading())).rejects.toThrow('Prediction CSV writer is not open');
  });

  it('rejects double-open on the same writer instance', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'bp-predict-double-open-'));
    const writer = new PredictionCsvFileWriter();

    await writer.open(directory);

    await expect(writer.open(directory)).rejects.toThrow('Prediction CSV writer is already open');

    await writer.close();
  });

  it('waits for backpressure drain before resolving writes', async () => {
    const chunks: string[] = [];
    const stream = new Writable({
      highWaterMark: 1,
      write(chunk, _encoding, callback) {
        chunks.push(chunk.toString('utf8'));
        setImmediate(callback);
      },
    });
    const writer = new PredictionCsvFileWriter(() => stream);

    await writer.open('/tmp/images');
    await writer.write(createReading());
    await writer.close();

    expect(chunks[0]).toBe(
      'imageId,time,hand,systolic,diastolic,pulse,status,confidence,uncertainFields,provider,model,rawNotes\n',
    );
    expect(chunks[1]).toContain('img001,2026-05-20 14:01:23,right,127,72,69');
    expect(chunks.join('')).toContain('img001,2026-05-20 14:01:23,right,127,72,69');
  });

  it('reports write errors with the target CSV path', async () => {
    const stream = new Writable({
      write(_chunk, _encoding, callback) {
        callback(new Error('disk full'));
      },
    });
    const writer = new PredictionCsvFileWriter(() => stream);

    await expect(writer.open('/tmp/images')).rejects.toThrow('Failed to write prediction CSV at /tmp/images/p.csv: disk full');
  });

  it('resets and destroys the stream when the header write fails', async () => {
    const failedStream = new Writable({
      write(_chunk, _encoding, callback) {
        callback(new Error('header failed'));
      },
    });
    const successfulChunks: string[] = [];
    const successfulStream = new Writable({
      write(chunk, _encoding, callback) {
        successfulChunks.push(chunk.toString('utf8'));
        callback();
      },
    });
    const writer = new PredictionCsvFileWriter(jest.fn().mockReturnValueOnce(failedStream).mockReturnValueOnce(successfulStream));

    await expect(writer.open('/tmp/images')).rejects.toThrow(
      'Failed to write prediction CSV at /tmp/images/p.csv: header failed',
    );
    expect(failedStream.destroyed).toBe(true);

    await writer.open('/tmp/images');
    await writer.close();

    expect(successfulChunks[0]).toBe(
      'imageId,time,hand,systolic,diastolic,pulse,status,confidence,uncertainFields,provider,model,rawNotes\n',
    );
  });

  it('reports close errors with the target CSV path', async () => {
    const stream = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
      final(callback) {
        callback(new Error('close failed'));
      },
    });
    const writer = new PredictionCsvFileWriter(() => stream);

    await writer.open('/tmp/images');

    await expect(writer.close()).rejects.toThrow('Failed to close prediction CSV at /tmp/images/p.csv: close failed');
  });

  it('uses the write callback error when backpressure is active', async () => {
    const stream = new Writable({
      highWaterMark: 1,
      write(_chunk, _encoding, callback) {
        callback(new Error('callback failed'));
      },
    });
    const writer = new PredictionCsvFileWriter(() => stream);

    await expect(writer.open('/tmp/images')).rejects.toThrow(
      'Failed to write prediction CSV at /tmp/images/p.csv: callback failed',
    );
  });
});

function createReading(overrides: Partial<ConstructorParameters<typeof PredictedReading>[0]> = {}): PredictedReading {
  return new PredictedReading({
    imageId: 'img001',
    imagePath: 'data/eval/img001.jpg',
    time: '2026-05-20 14:01:23',
    hand: 'right',
    systolic: 127,
    diastolic: 72,
    pulse: 69,
    confidence: 0.95,
    status: 'complete',
    uncertainFields: [],
    provider: 'openai',
    model: 'gpt-5.4-mini',
    rawNotes: null,
    ...overrides,
  });
}