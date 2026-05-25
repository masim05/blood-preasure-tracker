import { mkdtempSync, writeFileSync } from 'node:fs';
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
            time: '2026-05-20 14:01:23 GMT+7',
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