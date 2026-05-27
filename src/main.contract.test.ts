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

import { runCliWithDependencies } from './main';

describe('CLI contract', () => {
  it('treats generated p.csv as eval reference data and runs fresh predictions', async () => {
    const output = new PassThrough();
    let stdout = '';
    output.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    const fixtureDir = mkdtempSync(path.join(tmpdir(), 'bp-cli-contract-'));
    writeFileSync(path.join(fixtureDir, 'img001.jpg'), Buffer.from('fixture-image'));
    writeFileSync(
      path.join(fixtureDir, 'p.csv'),
      [
        'imageId,time,hand,systolic,diastolic,pulse,status,confidence,uncertainFields,provider,model,rawNotes',
        'img001,,right,127,72,69,complete,0.95,[],openai,gpt-5.4-mini,reference row',
      ].join('\n'),
    );

    const exitCode = await runCliWithDependencies(
      ['eval', '--input', fixtureDir, '--csv', path.join(fixtureDir, 'p.csv')],
      { OPENAI_API_KEY: 'test-key' },
      output,
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain('"type":"comparison"');
    expect(stdout).toContain('"type":"summary"');
    expect(stdout).toContain('"groundTruth":{"imageId":"img001"');
  });
});