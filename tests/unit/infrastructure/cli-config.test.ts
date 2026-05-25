import { CliParser } from '../../../src/adapters/inbound/cli/cli-parser';
import {
  CliConfigService,
  validateProviderConfig,
} from '../../../src/infrastructure/config/cli-config';
import { EnvConfigService } from '../../../src/infrastructure/config/env-config';

describe('CliConfigService', () => {
  it('defaults to help when no command is provided', () => {
    const service = new CliConfigService(new CliParser(), new EnvConfigService());

    expect(service.resolve([], {})).toMatchObject({
      command: 'help',
      inputDirectory: 'data/eval',
      evaluationCsvPath: 'data/eval/a.csv',
      provider: 'openai',
      model: 'gpt-5.4-mini',
    });
  });

  it('prefers CLI arguments over environment defaults', () => {
    const service = new CliConfigService(new CliParser(), new EnvConfigService());

    expect(
      service.resolve(
        ['predict', '--input', './images', '--csv', './override.csv', '--provider', 'openai', '--model', 'cli-model'],
        {
          CLI_INPUT_DIR: './env-images',
          CLI_EVAL_CSV: './env.csv',
          CLI_PROVIDER: 'openai',
          CLI_MODEL: 'env-model',
        },
      ),
    ).toMatchObject({
      command: 'predict',
      inputDirectory: './images',
      evaluationCsvPath: './override.csv',
      provider: 'openai',
      model: 'cli-model',
    });
  });

  it('marks help requests when the help flag is present', () => {
    const service = new CliConfigService(new CliParser(), new EnvConfigService());

    expect(service.resolve(['--help'], {})).toMatchObject({
      command: 'help',
      helpRequested: true,
    });
  });

  it('uses process argv when no argv is provided', () => {
    const service = new CliConfigService(new CliParser(), new EnvConfigService());
    const previousArgv = process.argv;

    process.argv = ['node', 'script', 'eval'];

    try {
      expect(service.resolve(undefined, {})).toMatchObject({
        command: 'eval',
      });
    } finally {
      process.argv = previousArgv;
    }
  });
});

describe('validateProviderConfig', () => {
  it('allows openai when the API key is present', () => {
    expect(() =>
      validateProviderConfig(
        {
          command: 'predict',
          helpRequested: false,
          inputDirectory: 'data/eval',
          evaluationCsvPath: 'data/eval/a.csv',
          provider: 'openai',
          model: 'gpt-5.4-mini',
        },
        {
          openAiApiKey: 'test-key',
          inputDirectory: 'data/eval',
          evaluationCsvPath: 'data/eval/a.csv',
          provider: 'openai',
          model: 'gpt-5.4-mini',
        },
      ),
    ).not.toThrow();
  });

  it('fails when openai is selected without an API key', () => {
    expect(() =>
      validateProviderConfig(
        {
          command: 'predict',
          helpRequested: false,
          inputDirectory: 'data/eval',
          evaluationCsvPath: 'data/eval/a.csv',
          provider: 'openai',
          model: 'gpt-5.4-mini',
        },
        {
          openAiApiKey: null,
          inputDirectory: 'data/eval',
          evaluationCsvPath: 'data/eval/a.csv',
          provider: 'openai',
          model: 'gpt-5.4-mini',
        },
      ),
    ).toThrow('OPENAI_API_KEY is required');
  });

  it('fails when an unsupported provider is selected', () => {
    expect(() =>
      validateProviderConfig(
        {
          command: 'predict',
          helpRequested: false,
          inputDirectory: 'data/eval',
          evaluationCsvPath: 'data/eval/a.csv',
          provider: 'custom',
          model: 'custom-model',
        },
        {
          openAiApiKey: null,
          inputDirectory: 'data/eval',
          evaluationCsvPath: 'data/eval/a.csv',
          provider: 'custom',
          model: 'custom-model',
        },
      ),
    ).toThrow('Unsupported provider: custom');
  });
});