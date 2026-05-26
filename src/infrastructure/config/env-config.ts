import { Injectable } from '@nestjs/common';
import { existsSync } from 'node:fs';

export type EnvironmentConfig = {
  openAiApiKey: string | null;
  inputDirectory: string;
  evaluationCsvPath: string;
  provider: string;
  model: string;
};

@Injectable()
export class EnvConfigService {
  load(env: NodeJS.ProcessEnv = process.env): EnvironmentConfig {
    const runtimeEnv = env === process.env ? loadRuntimeEnv(env) : env;

    return {
      openAiApiKey: runtimeEnv.OPENAI_API_KEY ?? null,
      inputDirectory: runtimeEnv.CLI_INPUT_DIR ?? 'data/eval',
      evaluationCsvPath: runtimeEnv.CLI_EVAL_CSV ?? 'data/eval/a.csv',
      provider: runtimeEnv.CLI_PROVIDER ?? 'openai',
      model: runtimeEnv.CLI_MODEL ?? 'gpt-5.4-mini',
    };
  }
}

function loadRuntimeEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  if (existsSync('.env')) {
    process.loadEnvFile('.env');
  }

  return env;
}