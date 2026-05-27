import { CliParser } from './cli-parser';

describe('CliParser', () => {
  it('parses predict arguments and options', () => {
    const parser = new CliParser();

    expect(
      parser.parse(['predict', '--input', './images', '--provider', 'openai', '--model', 'gpt-5.4-mini']),
    ).toEqual({
      command: 'predict',
      help: false,
      inputDirectory: './images',
      evaluationCsvPath: null,
      provider: 'openai',
      model: 'gpt-5.4-mini',
    });
  });

  it('parses eval arguments and csv override', () => {
    const parser = new CliParser();

    expect(parser.parse(['eval', '--csv', './data/a.csv'])).toEqual({
      command: 'eval',
      help: false,
      inputDirectory: null,
      evaluationCsvPath: './data/a.csv',
      provider: null,
      model: null,
    });
  });

  it('parses help flags without a command', () => {
    const parser = new CliParser();

    expect(parser.parse(['--help'])).toEqual({
      command: null,
      help: true,
      inputDirectory: null,
      evaluationCsvPath: null,
      provider: null,
      model: null,
    });
  });

  it('fails on unknown arguments', () => {
    const parser = new CliParser();

    expect(() => parser.parse(['predict', '--wat'])).toThrow('Unknown CLI argument');
  });

  it('fails when an option value is missing', () => {
    const parser = new CliParser();

    expect(() => parser.parse(['predict', '--input'])).toThrow('Missing value for --input');
  });
});