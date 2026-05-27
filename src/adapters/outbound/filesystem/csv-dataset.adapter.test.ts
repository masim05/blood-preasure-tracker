import { CsvDatasetAdapter } from './csv-dataset.adapter';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

describe('CsvDatasetAdapter', () => {
  it('loads ground truth rows keyed by imageId', async () => {
    const adapter = new CsvDatasetAdapter();

    const rows = await adapter.parse([
      'imageId,time,hand,systolic,diastolic,pulse',
      'img001,2026-05-20 14:01:23 GMT+7,right,127,72,69',
    ].join('\n'));

    expect(rows).toEqual([
      {
        imageId: 'img001',
        time: '2026-05-20 14:01:23 GMT+7',
        hand: 'right',
        systolic: 127,
        diastolic: 72,
        pulse: 69,
      },
    ]);
  });

  it('parses CRLF CSV rows', async () => {
    const adapter = new CsvDatasetAdapter();

    const rows = await adapter.parse('imageId,time,hand,systolic,diastolic,pulse\r\nimg001,now,right,127,72,69\r\n');

    expect(rows).toHaveLength(1);
    expect(rows[0]?.imageId).toBe('img001');
  });

  it('accepts generated prediction CSV files with service columns', async () => {
    const adapter = new CsvDatasetAdapter();

    const rows = await adapter.parse(
      [
        'imageId,time,hand,systolic,diastolic,pulse,status,confidence,uncertainFields,provider,model,rawNotes',
        'img001,2026-05-20 14:01:23,right,127,72,69,complete,0.95,[],openai,gpt-5.4-mini,',
        'img002,,left,120,70,68,partial,0.82,"[""time""]",openai,gpt-5.4-mini,"missing timestamp, still readable"',
      ].join('\n'),
    );

    expect(rows).toEqual([
      {
        imageId: 'img001',
        time: '2026-05-20 14:01:23',
        hand: 'right',
        systolic: 127,
        diastolic: 72,
        pulse: 69,
      },
      {
        imageId: 'img002',
        time: null,
        hand: 'left',
        systolic: 120,
        diastolic: 70,
        pulse: 68,
      },
    ]);
  });

  it('ignores quoted service columns with commas and line breaks', async () => {
    const adapter = new CsvDatasetAdapter();

    const rows = await adapter.parse(
      [
        'imageId,time,hand,systolic,diastolic,pulse,status,confidence,uncertainFields,provider,model,rawNotes',
        'img001,2026-05-20 14:01:23,right,127,72,69,complete,0.95,[],openai,gpt-5.4-mini,"provider note, line one',
        'line two"',
      ].join('\n'),
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.imageId).toBe('img001');
  });

  it('fails on duplicate imageId rows', async () => {
    const adapter = new CsvDatasetAdapter();

    await expect(
      adapter.parse(
        [
          'imageId,time,hand,systolic,diastolic,pulse',
          'img001,2026-05-20 14:01:23 GMT+7,right,127,72,69',
          'img001,2026-05-20 14:01:24 GMT+7,right,128,73,70',
        ].join('\n'),
      ),
    ).rejects.toThrow('Duplicate imageId');
  });

  it('normalizes imageId values with file extensions', async () => {
    const adapter = new CsvDatasetAdapter();

    const rows = await adapter.parse([
      'imageId,time,hand,systolic,diastolic,pulse',
      'img001.jpg,2026-05-20 14:01:23 GMT+7,right,127,72,69',
    ].join('\n'));

    expect(rows[0]?.imageId).toBe('img001');
  });

  it('loads rows from disk', async () => {
    const adapter = new CsvDatasetAdapter();
    const directory = mkdtempSync(path.join(tmpdir(), 'bp-csv-'));
    const csvPath = path.join(directory, 'a.csv');
    writeFileSync(
      csvPath,
      ['imageId,time,hand,systolic,diastolic,pulse', 'img001,2026-05-20 14:01:23 GMT+7,right,127,72,69'].join('\n'),
    );

    const rows = await adapter.load(csvPath);

    expect(rows).toHaveLength(1);
  });

  it('returns an empty array for empty content', async () => {
    const adapter = new CsvDatasetAdapter();

    await expect(adapter.parse('')).resolves.toEqual([]);
  });

  it('fails when a required header is missing', async () => {
    const adapter = new CsvDatasetAdapter();

    await expect(adapter.parse('imageId,time,hand,systolic,diastolic\nimg001,now,right,127,72')).rejects.toThrow(
      'Missing required CSV header: pulse',
    );
  });

  it('fails when generated CSV is missing a required core column even with service columns present', async () => {
    const adapter = new CsvDatasetAdapter();

    await expect(
      adapter.parse('imageId,time,hand,systolic,diastolic,status,confidence\nimg001,now,right,127,72,complete,0.95'),
    ).rejects.toThrow('Missing required CSV header: pulse');
  });

  it('fails when hand has an unsupported value', async () => {
    const adapter = new CsvDatasetAdapter();

    await expect(
      adapter.parse('imageId,time,hand,systolic,diastolic,pulse\nimg001,now,center,127,72,69'),
    ).rejects.toThrow('Unsupported hand value: center');
  });

  it('fails when a numeric field is invalid', async () => {
    const adapter = new CsvDatasetAdapter();

    await expect(
      adapter.parse('imageId,time,hand,systolic,diastolic,pulse\nimg001,now,right,nope,72,69'),
    ).rejects.toThrow('Invalid numeric value: nope');
  });

  it('fails when a numeric field has trailing non-numeric text', async () => {
    const adapter = new CsvDatasetAdapter();

    await expect(
      adapter.parse('imageId,time,hand,systolic,diastolic,pulse\nimg001,now,right,127abc,72,69'),
    ).rejects.toThrow('Invalid numeric value: 127abc');
  });

  it('keeps blank optional fields as null', async () => {
    const adapter = new CsvDatasetAdapter();

    const rows = await adapter.parse('imageId,time,hand,systolic,diastolic,pulse\nimg001,,,,,');

    expect(rows).toEqual([
      {
        imageId: 'img001',
        time: null,
        hand: null,
        systolic: null,
        diastolic: null,
        pulse: null,
      },
    ]);
  });

  it('fails when imageId is blank after normalization', async () => {
    const adapter = new CsvDatasetAdapter();

    await expect(
      adapter.parse('imageId,time,hand,systolic,diastolic,pulse\n,2026-05-20 14:01:23 GMT+7,right,127,72,69'),
    ).rejects.toThrow('GroundTruthRecord.imageId is required');
  });
});