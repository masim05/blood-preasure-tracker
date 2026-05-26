import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: class OpenAI {
      readonly responses = {
        create: jest.fn().mockResolvedValue({
          output_text: JSON.stringify({
            hand: 'right',
            systolic: 127,
            diastolic: 72,
            pulse: 69,
            confidence: 0.95,
            uncertainFields: [],
            rawNotes: null,
          }),
        }),
      };
    },
  };
});

import { runCliWithDependencies } from '../../src/main';

describe('CLI integration', () => {
  it('supports predict mode from the cli entry point', async () => {
    const output = new PassThrough();
    let stdout = '';
    output.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });

    const fixtureDir = mkdtempSync(path.join(tmpdir(), 'bp-cli-'));
    writeFileSync(path.join(fixtureDir, 'img001.jpg'), Buffer.from('fixture-image'));

    const exitCode = await runCliWithDependencies(
      ['predict', '--input', fixtureDir],
      { OPENAI_API_KEY: 'test-key' },
      output,
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain('"type":"prediction"');
    expect(stdout).toContain('"model":"gpt-5.4-mini"');
  });

  it('creates p.csv with prediction rows while preserving JSONL stdout', async () => {
    const output = new PassThrough();
    let stdout = '';
    output.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });

    const fixtureDir = mkdtempSync(path.join(tmpdir(), 'bp-cli-predict-csv-'));
    const csvPath = path.join(fixtureDir, 'p.csv');
    writeFileSync(path.join(fixtureDir, 'img001.jpg'), Buffer.from('fixture-image'));
    writeFileSync(csvPath, 'stale\n');

    const exitCode = await runCliWithDependencies(
      ['predict', '--input', fixtureDir],
      { OPENAI_API_KEY: 'test-key' },
      output,
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain('"type":"prediction"');
    expect(stdout).toContain('"imageId":"img001"');
    expect(readFileSync(csvPath, 'utf8')).toBe(
      [
        'imageId,time,hand,systolic,diastolic,pulse,status,confidence,uncertainFields,provider,model,rawNotes',
        'img001,,right,127,72,69,partial,0.95,"[""time""]",openai,gpt-5.4-mini,',
        '',
      ].join('\n'),
    );
  });

  it('creates a header-only p.csv for an empty input directory', async () => {
    const output = new PassThrough();
    const fixtureDir = mkdtempSync(path.join(tmpdir(), 'bp-cli-empty-csv-'));

    const exitCode = await runCliWithDependencies(
      ['predict', '--input', fixtureDir],
      { OPENAI_API_KEY: 'test-key' },
      output,
    );

    expect(exitCode).toBe(0);
    expect(readFileSync(path.join(fixtureDir, 'p.csv'), 'utf8')).toBe(
      'imageId,time,hand,systolic,diastolic,pulse,status,confidence,uncertainFields,provider,model,rawNotes\n',
    );
  });

  it('emits metadata-derived time for the reported JPEG fixture', async () => {
    const output = new PassThrough();
    let stdout = '';
    output.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });

    const fixtureDir = mkdtempSync(path.join(tmpdir(), 'bp-cli-exif-'));
    writeFileSync(
      path.join(fixtureDir, '2026-05-19 06-05-20.JPG'),
      readFileSync(path.join(process.cwd(), 'tests/fixtures/images/2026-05-19 06-05-20.JPG')),
    );

    const exitCode = await runCliWithDependencies(
      ['predict', '--input', fixtureDir],
      { OPENAI_API_KEY: 'test-key' },
      output,
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain('"time":"2026-05-19 06:05:20"');
    expect(stdout).toContain('"uncertainFields":[]');
  });

  it('keeps missing metadata time null and uncertain while continuing prediction', async () => {
    const output = new PassThrough();
    let stdout = '';
    output.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });

    const fixtureDir = mkdtempSync(path.join(tmpdir(), 'bp-cli-missing-time-'));
    writeFileSync(path.join(fixtureDir, 'img001.jpg'), Buffer.from('fixture-image'));

    const exitCode = await runCliWithDependencies(
      ['predict', '--input', fixtureDir],
      { OPENAI_API_KEY: 'test-key' },
      output,
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain('"time":null');
    expect(stdout).toContain('"uncertainFields":["time"]');
  });

  it('shows predict in help output', async () => {
    const output = new PassThrough();
    let stdout = '';
    output.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });

    const exitCode = await runCliWithDependencies(['predict', '--help'], {}, output);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('predict');
  });

  it('supports eval mode and emits comparison plus summary records', async () => {
    const output = new PassThrough();
    let stdout = '';
    output.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });

    const fixtureDir = mkdtempSync(path.join(tmpdir(), 'bp-cli-eval-'));
    writeFileSync(path.join(fixtureDir, 'img001.jpg'), Buffer.from('fixture-image'));
    writeFileSync(
      path.join(fixtureDir, 'a.csv'),
      ['imageId,time,hand,systolic,diastolic,pulse', 'img001,2026-05-20 14:01:23 GMT+7,right,127,72,69'].join('\n'),
    );

    const exitCode = await runCliWithDependencies(
      ['eval', '--input', fixtureDir, '--csv', path.join(fixtureDir, 'a.csv')],
      { OPENAI_API_KEY: 'test-key' },
      output,
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain('"type":"comparison"');
    expect(stdout).toContain('"type":"summary"');
  });

  it('accepts a predict-generated p.csv as eval reference data', async () => {
    const predictOutput = new PassThrough();
    const evalOutput = new PassThrough();
    let stdout = '';
    evalOutput.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });

    const fixtureDir = mkdtempSync(path.join(tmpdir(), 'bp-cli-round-trip-'));
    writeFileSync(path.join(fixtureDir, 'img001.jpg'), Buffer.from('fixture-image'));

    const predictExitCode = await runCliWithDependencies(
      ['predict', '--input', fixtureDir],
      { OPENAI_API_KEY: 'test-key' },
      predictOutput,
    );
    const evalExitCode = await runCliWithDependencies(
      ['eval', '--input', fixtureDir, '--csv', path.join(fixtureDir, 'p.csv')],
      { OPENAI_API_KEY: 'test-key' },
      evalOutput,
    );

    expect(predictExitCode).toBe(0);
    expect(evalExitCode).toBe(0);
    expect(stdout).toContain('"type":"comparison"');
    expect(stdout).toContain('"type":"summary"');
    expect(stdout).toContain('"groundTruth":{"imageId":"img001"');
  });

  it('matches eval CSV time against metadata-derived time', async () => {
    const output = new PassThrough();
    let stdout = '';
    output.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });

    const fixtureDir = mkdtempSync(path.join(tmpdir(), 'bp-cli-eval-exif-'));
    writeFileSync(
      path.join(fixtureDir, '2026-05-19 06-05-20.JPG'),
      readFileSync(path.join(process.cwd(), 'tests/fixtures/images/2026-05-19 06-05-20.JPG')),
    );
    writeFileSync(
      path.join(fixtureDir, 'a.csv'),
      [
        'imageId,time,hand,systolic,diastolic,pulse',
        '2026-05-19 06-05-20,2026-05-19 06:05:20,right,127,72,69',
      ].join('\n'),
    );

    const exitCode = await runCliWithDependencies(
      ['eval', '--input', fixtureDir, '--csv', path.join(fixtureDir, 'a.csv')],
      { OPENAI_API_KEY: 'test-key' },
      output,
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain('"matchStatus":"matched"');
    expect(stdout).toContain('"time":"match"');
  });

  it('shows the static model catalog in help output', async () => {
    const output = new PassThrough();
    let stdout = '';
    output.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });

    const exitCode = await runCliWithDependencies(['--help'], {}, output);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('Available models:');
    expect(stdout).toContain('openai: gpt-5.4-mini');
  });

  it('prefers CLI model arguments over environment defaults', async () => {
    const output = new PassThrough();
    let stdout = '';
    output.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });

    const fixtureDir = mkdtempSync(path.join(tmpdir(), 'bp-cli-model-'));
    writeFileSync(path.join(fixtureDir, 'img001.jpg'), Buffer.from('fixture-image'));

    const exitCode = await runCliWithDependencies(
      ['predict', '--input', fixtureDir, '--model', 'cli-model'],
      { OPENAI_API_KEY: 'test-key', CLI_MODEL: 'env-model' },
      output,
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain('"model":"cli-model"');
    expect(stdout).not.toContain('"model":"env-model"');
  });
});