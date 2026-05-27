import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { ApiModule } from './api.module';
import { ApiConfigService } from './infrastructure/config/api-config';
import { loadApiLoggingConfig } from './infrastructure/config/api-logging-config';

export async function runApi(env: NodeJS.ProcessEnv = process.env): Promise<void> {
  const logging = loadApiLoggingConfig(env);
  const app = await NestFactory.create(ApiModule, { logger: logging.levels });
  const config = app.get(ApiConfigService).load(env);

  await app.listen(config.apiPort);
}

/* istanbul ignore next: API auto-bootstrap side effect */
if (!process.env.JEST_WORKER_ID) {
  void runApi();
}
