import { Injectable } from '@nestjs/common';
import { existsSync } from 'node:fs';

export type ApiConfig = {
  databaseUrl: string;
  apiPort: number;
  measurementImageDirectory: string;
  accessTokenTtlSeconds: number;
  recognitionWorkerIntervalSeconds: number;
  recognitionWorkerBatchSize: number;
};

@Injectable()
export class ApiConfigService {
  load(env: NodeJS.ProcessEnv = process.env): ApiConfig {
    const runtimeEnv = env === process.env ? loadRuntimeEnv(env) : env;

    return {
      databaseUrl: readRequired(runtimeEnv, 'DATABASE_URL'),
      apiPort: readPositiveInteger(runtimeEnv.API_PORT, 3000, 'API_PORT'),
      measurementImageDirectory: runtimeEnv.MEASUREMENT_IMAGE_DIR ?? './tmp/measurement-images',
      accessTokenTtlSeconds: readPositiveInteger(
        runtimeEnv.ACCESS_TOKEN_TTL_SECONDS,
        604800,
        'ACCESS_TOKEN_TTL_SECONDS',
      ),
      recognitionWorkerIntervalSeconds: readPositiveInteger(
        runtimeEnv.RECOGNITION_WORKER_INTERVAL_SECONDS,
        10,
        'RECOGNITION_WORKER_INTERVAL_SECONDS',
      ),
      recognitionWorkerBatchSize: readPositiveInteger(
        runtimeEnv.RECOGNITION_WORKER_BATCH_SIZE,
        4,
        'RECOGNITION_WORKER_BATCH_SIZE',
      ),
    };
  }
}

function loadRuntimeEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  if (existsSync('.env')) {
    process.loadEnvFile('.env');
  }

  return env;
}

function readRequired(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key];
  if (!value) {
    throw new Error(`${key} is required`);
  }

  return value;
}

function readPositiveInteger(
  value: string | undefined,
  defaultValue: number,
  key: string,
): number {
  if (value === undefined) {
    return defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer`);
  }

  return parsed;
}
