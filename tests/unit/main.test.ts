const createApplicationContext = jest.fn();

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    createApplicationContext,
  },
}));

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

import { PassThrough } from 'node:stream';

import { runCli, runCliWithDependencies } from '../../src/main';

describe('main entrypoint', () => {
  it('uses the default model registry entry when the CLI config model is empty', async () => {
    const output = new PassThrough();
    let stdout = '';
    output.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });

    const exitCode = await runCliWithDependencies(
      ['predict'],
      { OPENAI_API_KEY: 'test-key' },
      output,
      {
        cliConfigService: {
          resolve: () => ({
            command: 'predict',
            helpRequested: false,
            inputDirectory: 'data/eval',
            evaluationCsvPath: 'data/eval/a.csv',
            provider: 'openai',
            model: '',
          }),
        } as never,
        envConfigService: {
          load: () => ({
            openAiApiKey: 'test-key',
            inputDirectory: 'data/eval',
            evaluationCsvPath: 'data/eval/a.csv',
            provider: 'openai',
            model: 'env-model',
          }),
        } as never,
        modelRegistry: {
          list: () => [],
          getDefaultModel: () => 'registry-default-model',
        } as never,
        imageDirectoryAdapter: {
          load: jest.fn().mockResolvedValue([
            {
              imageId: 'img001',
              imagePath: 'data/eval/img001.jpg',
              contentType: 'image/jpeg',
              data: Buffer.from('fixture-image'),
            },
          ]),
        } as never,
        evaluationDataset: {
          load: jest.fn().mockResolvedValue([]),
        } as never,
        helpRenderer: {
          render: () => 'help',
        } as never,
      },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain('"model":"registry-default-model"');
  });

  it('returns 1 when the Nest bootstrap path throws', async () => {
    createApplicationContext.mockResolvedValueOnce({
      get: () => {
        throw new Error('bootstrap failure');
      },
      close: jest.fn().mockResolvedValue(undefined),
    });

    const exitCode = await runCli(['predict'], { OPENAI_API_KEY: 'test-key' }, new PassThrough());

    expect(exitCode).toBe(1);
  });

  it('returns the fallback output for unsupported command branches', async () => {
    const output = new PassThrough();
    let stdout = '';
    output.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });

    const exitCode = await runCliWithDependencies(
      [],
      {},
      output,
      {
        cliConfigService: {
          resolve: () => ({
            command: 'noop',
            helpRequested: false,
            inputDirectory: 'data/eval',
            evaluationCsvPath: 'data/eval/a.csv',
            provider: 'custom',
            model: 'custom-model',
          }),
        } as never,
        envConfigService: {
          load: () => ({
            openAiApiKey: null,
            inputDirectory: 'data/eval',
            evaluationCsvPath: 'data/eval/a.csv',
            provider: 'custom',
            model: 'custom-model',
          }),
        } as never,
        modelRegistry: {
          list: () => [],
          getDefaultModel: () => 'unused',
        } as never,
        imageDirectoryAdapter: {
          load: jest.fn().mockResolvedValue([]),
        } as never,
        evaluationDataset: {
          load: jest.fn().mockResolvedValue([]),
        } as never,
        helpRenderer: {
          render: () => 'help',
        } as never,
      },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain('noop foundation ready for provider custom and model custom-model.');
  });

  it('fails when predict uses openai without an API key', async () => {
    await expect(
      runCliWithDependencies(
        ['predict'],
        {},
        new PassThrough(),
        {
          cliConfigService: {
            resolve: () => ({
              command: 'predict',
              helpRequested: false,
              inputDirectory: 'data/eval',
              evaluationCsvPath: 'data/eval/a.csv',
              provider: 'openai',
              model: 'gpt-5.4-mini',
            }),
          } as never,
          envConfigService: {
            load: () => ({
              openAiApiKey: null,
              inputDirectory: 'data/eval',
              evaluationCsvPath: 'data/eval/a.csv',
              provider: 'openai',
              model: 'gpt-5.4-mini',
            }),
          } as never,
          modelRegistry: {
            list: () => [],
            getDefaultModel: () => 'unused',
          } as never,
          imageDirectoryAdapter: {
            load: jest.fn().mockResolvedValue([]),
          } as never,
          evaluationDataset: {
            load: jest.fn().mockResolvedValue([]),
          } as never,
          helpRenderer: {
            render: () => 'help',
          } as never,
        },
      ),
    ).rejects.toThrow('OPENAI_API_KEY is required');
  });

  it('fails during provider creation when validation is bypassed and no API key is available', async () => {
    await expect(
      runCliWithDependencies(
        ['predict'],
        {},
        new PassThrough(),
        {
          cliConfigService: {
            resolve: () => ({
              command: 'predict',
              helpRequested: false,
              inputDirectory: 'data/eval',
              evaluationCsvPath: 'data/eval/a.csv',
              provider: 'custom',
              model: 'custom-model',
            }),
          } as never,
          envConfigService: {
            load: () => ({
              openAiApiKey: null,
              inputDirectory: 'data/eval',
              evaluationCsvPath: 'data/eval/a.csv',
              provider: 'custom',
              model: 'custom-model',
            }),
          } as never,
          modelRegistry: {
            list: () => [],
            getDefaultModel: () => 'unused',
          } as never,
          imageDirectoryAdapter: {
            load: jest.fn().mockResolvedValue([]),
          } as never,
          evaluationDataset: {
            load: jest.fn().mockResolvedValue([]),
          } as never,
          helpRenderer: {
            render: () => 'help',
          } as never,
        },
      ),
    ).rejects.toThrow('OPENAI_API_KEY is required');
  });

});