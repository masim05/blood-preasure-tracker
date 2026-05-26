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
  it('uses the resolved CLI config model for predict', async () => {
    const output = new PassThrough();
    let stdout = '';
    const getDefaultModel = jest.fn().mockReturnValue('registry-default-model');
    const loadEnv = jest.fn().mockReturnValue({
      openAiApiKey: 'test-key',
      inputDirectory: 'data/eval',
      evaluationCsvPath: 'data/eval/a.csv',
      provider: 'openai',
      model: 'env-model',
    });
    output.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });

    const exitCode = await runCliWithDependencies(
      ['predict'],
      { OPENAI_API_KEY: 'test-key' },
      output,
      {
        cliConfigService: {
          resolveFromEnvironment: () => ({
            command: 'predict',
            helpRequested: false,
            inputDirectory: 'data/eval',
            evaluationCsvPath: 'data/eval/a.csv',
            provider: 'openai',
            model: 'resolved-model',
          }),
        } as never,
        envConfigService: {
          load: loadEnv,
        } as never,
        modelRegistry: {
          list: () => [],
          getDefaultModel,
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
        imageMetadataAdapter: {
          extractTimestamp: jest.fn().mockResolvedValue({
            imageId: 'img001',
            imagePath: 'data/eval/img001.jpg',
            time: '2026-05-20 14:01:23',
            sourceTag: 'DateTimeOriginal',
            rawValue: '2026:05:20 14:01:23',
            issues: [],
          }),
        } as never,
        evaluationDataset: {
          load: jest.fn().mockResolvedValue([]),
        } as never,
        predictionCsvWriterFactory: () => ({
          open: jest.fn().mockResolvedValue(undefined),
          write: jest.fn().mockResolvedValue(undefined),
          close: jest.fn().mockResolvedValue(undefined),
        }) as never,
        helpRenderer: {
          render: () => 'help',
        } as never,
      },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain('"model":"resolved-model"');
    expect(getDefaultModel).not.toHaveBeenCalled();
    expect(loadEnv).toHaveBeenCalledTimes(1);
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

  it('fails when predict uses openai without an API key', async () => {
    await expect(
      runCliWithDependencies(
        ['predict'],
        {},
        new PassThrough(),
        {
          cliConfigService: {
            resolveFromEnvironment: () => ({
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
          imageMetadataAdapter: {
            extractTimestamp: jest.fn().mockResolvedValue({
              imageId: 'unused',
              imagePath: 'unused',
              time: null,
              sourceTag: null,
              rawValue: null,
              issues: [],
            }),
          } as never,
          evaluationDataset: {
            load: jest.fn().mockResolvedValue([]),
          } as never,
          predictionCsvWriterFactory: () => ({
            open: jest.fn().mockResolvedValue(undefined),
            write: jest.fn().mockResolvedValue(undefined),
            close: jest.fn().mockResolvedValue(undefined),
          }) as never,
          helpRenderer: {
            render: () => 'help',
          } as never,
        },
      ),
    ).rejects.toThrow('OPENAI_API_KEY is required');
  });

  it('surfaces prediction CSV write failures from the CLI command path', async () => {
    await expect(
      runCliWithDependencies(
        ['predict'],
        { OPENAI_API_KEY: 'test-key' },
        new PassThrough(),
        {
          cliConfigService: {
            resolveFromEnvironment: () => ({
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
              openAiApiKey: 'test-key',
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
          imageMetadataAdapter: {
            extractTimestamp: jest.fn(),
          } as never,
          evaluationDataset: {
            load: jest.fn().mockResolvedValue([]),
          } as never,
          predictionCsvWriterFactory: () => ({
            open: jest.fn().mockRejectedValue(new Error('Failed to write prediction CSV at data/eval/p.csv: denied')),
            write: jest.fn().mockResolvedValue(undefined),
            close: jest.fn().mockResolvedValue(undefined),
          }) as never,
          helpRenderer: {
            render: () => 'help',
          } as never,
        },
      ),
    ).rejects.toThrow('Failed to write prediction CSV at data/eval/p.csv: denied');
  });

  it('fails when an unsupported provider is selected', async () => {
    await expect(
      runCliWithDependencies(
        ['predict'],
        {},
        new PassThrough(),
        {
          cliConfigService: {
            resolveFromEnvironment: () => ({
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
          imageMetadataAdapter: {
            extractTimestamp: jest.fn().mockResolvedValue({
              imageId: 'unused',
              imagePath: 'unused',
              time: null,
              sourceTag: null,
              rawValue: null,
              issues: [],
            }),
          } as never,
          evaluationDataset: {
            load: jest.fn().mockResolvedValue([]),
          } as never,
          predictionCsvWriterFactory: () => ({
            open: jest.fn().mockResolvedValue(undefined),
            write: jest.fn().mockResolvedValue(undefined),
            close: jest.fn().mockResolvedValue(undefined),
          }) as never,
          helpRenderer: {
            render: () => 'help',
          } as never,
        },
      ),
    ).rejects.toThrow('Unsupported provider: custom');
  });

});