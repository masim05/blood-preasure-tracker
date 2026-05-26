import { Injectable } from '@nestjs/common';

import { CliParser, type ParsedCliArgs } from '../../adapters/inbound/cli/cli-parser';
import { EnvConfigService, type EnvironmentConfig } from './env-config';

export type CliCommand = 'predict' | 'eval' | 'help';

export type CliConfig = {
  command: CliCommand;
  helpRequested: boolean;
  inputDirectory: string;
  evaluationCsvPath: string;
  provider: string;
  model: string;
};

@Injectable()
export class CliConfigService {
  constructor(
    private readonly parser: CliParser,
    private readonly envConfigService: EnvConfigService,
  ) {}

  resolve(argv: string[] = process.argv.slice(2), env?: NodeJS.ProcessEnv): CliConfig {
    const parsedArgs = this.parser.parse(argv);
    const envConfig = this.envConfigService.load(env);

    return this.resolveFromEnvironment(parsedArgs, envConfig);
  }

  resolveFromEnvironment(argv: string[] | ParsedCliArgs, envConfig: EnvironmentConfig): CliConfig {
    const parsedArgs = Array.isArray(argv) ? this.parser.parse(argv) : argv;

    return {
      command: resolveCommand(parsedArgs),
      helpRequested: parsedArgs.help,
      inputDirectory: parsedArgs.inputDirectory ?? envConfig.inputDirectory,
      evaluationCsvPath: parsedArgs.evaluationCsvPath ?? envConfig.evaluationCsvPath,
      provider: parsedArgs.provider ?? envConfig.provider,
      model: parsedArgs.model ?? envConfig.model,
    };
  }
}

function resolveCommand(parsedArgs: ParsedCliArgs): CliCommand {
  if (parsedArgs.help) {
    return 'help';
  }

  return parsedArgs.command ?? 'help';
}

export function validateProviderConfig(config: CliConfig, envConfig: EnvironmentConfig): void {
  if (config.provider !== 'openai') {
    throw new Error(`Unsupported provider: ${config.provider}`);
  }

  if (config.provider === 'openai' && !envConfig.openAiApiKey) {
    throw new Error('OPENAI_API_KEY is required when provider is openai');
  }
}