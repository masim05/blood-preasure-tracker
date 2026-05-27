import { loadApiLoggingConfig } from '../../../src/infrastructure/config/api-logging-config';

describe('loadApiLoggingConfig', () => {
  it('uses production warn-and-above logging only when NODE_ENV is production', () => {
    expect(loadApiLoggingConfig({ NODE_ENV: 'production' })).toEqual({
      mode: 'production',
      levels: ['error', 'warn'],
      debugHttpRequests: false,
    });
  });

  it('uses debug-capable development logging when NODE_ENV is unset', () => {
    expect(loadApiLoggingConfig({}).levels).toEqual(['error', 'warn', 'log', 'debug', 'verbose']);
    expect(loadApiLoggingConfig({}).debugHttpRequests).toBe(true);
  });

  it('reads process.env when no environment object is provided', () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      expect(loadApiLoggingConfig()).toMatchObject({ mode: 'production', debugHttpRequests: false });
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
    }
  });

  it('uses debug-capable development logging for any non-production NODE_ENV', () => {
    expect(loadApiLoggingConfig({ NODE_ENV: 'test' })).toMatchObject({ mode: 'development', debugHttpRequests: true });
    expect(loadApiLoggingConfig({ NODE_ENV: 'development' }).levels).toContain('debug');
  });
});
