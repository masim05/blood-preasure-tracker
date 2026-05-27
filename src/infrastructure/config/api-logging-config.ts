import type { LogLevel } from '@nestjs/common';

export type ApiLoggingMode = 'development' | 'production';

export type ApiLoggingConfig = {
  mode: ApiLoggingMode;
  levels: LogLevel[];
  debugHttpRequests: boolean;
};

export function loadApiLoggingConfig(env: NodeJS.ProcessEnv = process.env): ApiLoggingConfig {
  if (env.NODE_ENV === 'production') {
    return { mode: 'production', levels: ['error', 'warn'], debugHttpRequests: false };
  }

  return { mode: 'development', levels: ['error', 'warn', 'log', 'debug', 'verbose'], debugHttpRequests: true };
}
