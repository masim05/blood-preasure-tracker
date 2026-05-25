import { Injectable } from '@nestjs/common';

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
    return {
      openAiApiKey: env.OPENAI_API_KEY ?? null,
      inputDirectory: env.CLI_INPUT_DIR ?? 'data/eval',
      evaluationCsvPath: env.CLI_EVAL_CSV ?? 'data/eval/a.csv',
      provider: env.CLI_PROVIDER ?? 'openai',
      model: env.CLI_MODEL ?? 'gpt-5.4-mini',
    };
  }
}