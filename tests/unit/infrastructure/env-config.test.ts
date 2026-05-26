import { existsSync } from 'node:fs';

import { EnvConfigService } from '../../../src/infrastructure/config/env-config';

jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
}));

const existsSyncMock = jest.mocked(existsSync);

describe('EnvConfigService', () => {
  beforeEach(() => {
    existsSyncMock.mockReturnValue(false);
  });

  it('returns default values when environment variables are absent', () => {
    const service = new EnvConfigService();

    expect(service.load({})).toEqual({
      openAiApiKey: null,
      inputDirectory: 'data/eval',
      evaluationCsvPath: 'data/eval/a.csv',
      provider: 'openai',
      model: 'gpt-5.4-mini',
    });
  });

  it('returns explicit environment overrides', () => {
    const service = new EnvConfigService();

    expect(
      service.load({
        OPENAI_API_KEY: 'test-key',
        CLI_INPUT_DIR: './images',
        CLI_EVAL_CSV: './eval.csv',
        CLI_PROVIDER: 'openai',
        CLI_MODEL: 'custom-model',
      }),
    ).toEqual({
      openAiApiKey: 'test-key',
      inputDirectory: './images',
      evaluationCsvPath: './eval.csv',
      provider: 'openai',
      model: 'custom-model',
    });
  });

  it('reads from process.env when no env object is provided', () => {
    const service = new EnvConfigService();
    const previousModel = process.env.CLI_MODEL;

    process.env.CLI_MODEL = 'process-model';

    try {
      expect(service.load().model).toBe('process-model');
    } finally {
      if (previousModel === undefined) {
        delete process.env.CLI_MODEL;
      } else {
        process.env.CLI_MODEL = previousModel;
      }
    }
  });

  it('loads values from a local .env file when using the runtime environment', () => {
    const service = new EnvConfigService();
    const previousApiKey = process.env.OPENAI_API_KEY;
    existsSyncMock.mockReturnValue(true);
    const loadEnvFileSpy = jest
      .spyOn(process, 'loadEnvFile')
      .mockImplementation((path?: string | URL) => {
        expect(path).toBe('.env');
        process.env.OPENAI_API_KEY = 'from-dot-env';
      });

    try {
      expect(service.load().openAiApiKey).toBe('from-dot-env');
    } finally {
      if (previousApiKey === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = previousApiKey;
      }

      loadEnvFileSpy.mockRestore();
    }
  });
});